import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";
import {
  DASHBOARD_LAYOUT_EVENT,
  applyDashboardPreset,
  createDefaultLayout,
  loadDashboardLayoutLocal,
  mergeWithDefaultLayout,
  resolveUserKey,
  saveDashboardLayoutLocal
} from "../../services/dashboardLayoutService";

/**
 * Hook React para leer, actualizar y sincronizar en la nube la personalización de dashboards.
 */
export function useDashboardLayout() {
  const { user, updateUserDashboardPreferences } = useAuth() || {};
  const [layout, setLayout] = useState(() => loadDashboardLayoutLocal(user));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const userRef = useRef(user);
  userRef.current = user;
  const updatePrefsRef = useRef(updateUserDashboardPreferences);
  updatePrefsRef.current = updateUserDashboardPreferences;

  const userKey = resolveUserKey(user);
  const cloudPrefsUpdatedAt = user?.dashboard_preferences?.updatedAt || null;
  const cloudTargetId = user && user.role !== "guest" ? (user._id || user.firebase_uid || user.uid) : null;

  // Cargar y resolver preferencia local vs nube cuando cambia el usuario conectado
  useEffect(() => {
    const activeUser = userRef.current;
    const resolved = loadDashboardLayoutLocal(activeUser);
    setLayout(resolved);
    if (activeUser?.dashboard_preferences) {
      saveDashboardLayoutLocal(resolved, activeUser);
    }
  }, [userKey, cloudPrefsUpdatedAt]);

  // Refrescar desde MongoDB una vez al montar/cambiar cuenta autenticada
  useEffect(() => {
    let active = true;
    if (!cloudTargetId) return undefined;

    userService
      .getDashboardPreferences(cloudTargetId)
      .then((res) => {
        if (!active || !res?.dashboard_preferences) return;
        const activeUser = userRef.current;
        const best = mergeWithDefaultLayout(res.dashboard_preferences);
        const current = loadDashboardLayoutLocal(activeUser);
        const remoteTs = best.updatedAt ? new Date(best.updatedAt).getTime() : 0;
        const localTs = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
        if (remoteTs >= localTs || !current.updatedAt) {
          saveDashboardLayoutLocal(best, activeUser);
          setLayout(best);
          if (updatePrefsRef.current) {
            updatePrefsRef.current(best);
          }
        }
      })
      .catch(() => {
        // Silencioso: la caché local mantiene la app fluida incluso sin conexión
      });

    return () => {
      active = false;
    };
  }, [cloudTargetId]);

  // Escuchar cambios realizados en otra vista/pestaña de la misma sesión
  useEffect(() => {
    const handleSyncEvent = (ev) => {
      if (ev?.detail) {
        setLayout(mergeWithDefaultLayout(ev.detail));
      } else {
        setLayout(loadDashboardLayoutLocal(userRef.current));
      }
    };
    window.addEventListener(DASHBOARD_LAYOUT_EVENT, handleSyncEvent);
    return () => window.removeEventListener(DASHBOARD_LAYOUT_EVENT, handleSyncEvent);
  }, [userKey]);

  const saveLayout = useCallback(
    async (nextLayoutOrUpdater, options = {}) => {
      const { localOnly = false } = options;
      const activeUser = userRef.current;
      const candidate =
        typeof nextLayoutOrUpdater === "function"
          ? nextLayoutOrUpdater(layout)
          : nextLayoutOrUpdater;

      const withTimestamp = {
        ...candidate,
        updatedAt: new Date().toISOString()
      };

      const savedLocal = saveDashboardLayoutLocal(withTimestamp, activeUser);
      setLayout(savedLocal);
      setSyncError(null);

      if (cloudTargetId && !localOnly) {
        setIsSyncing(true);
        try {
          await userService.saveDashboardPreferences(cloudTargetId, savedLocal);
          if (updatePrefsRef.current) {
            updatePrefsRef.current(savedLocal);
          }
          return { layout: savedLocal, syncedCloud: true };
        } catch (err) {
          console.error("Error sincronizando preferencias de dashboard en la nube:", err);
          setSyncError(err?.message || "Sync failed");
          return { layout: savedLocal, syncedCloud: false, error: err };
        } finally {
          setIsSyncing(false);
        }
      }

      return { layout: savedLocal, syncedCloud: false };
    },
    [layout, cloudTargetId]
  );

  const applyPreset = useCallback(
    (presetId) => {
      const next = applyDashboardPreset(presetId);
      return saveLayout(next);
    },
    [saveLayout]
  );

  const resetLayout = useCallback(() => {
    const fresh = createDefaultLayout();
    return saveLayout(fresh);
  }, [saveLayout]);

  return {
    layout,
    isSyncing,
    syncError,
    isCloudAccount: Boolean(cloudTargetId),
    saveLayout,
    applyPreset,
    resetLayout
  };
}
