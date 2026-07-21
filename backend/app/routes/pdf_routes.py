from fastapi import APIRouter, UploadFile, File, HTTPException
from app.pdf_parser import parse_acta_pdf

router = APIRouter(prefix="/pdf", tags=["PDF"])

@router.post("/parse-acta", response_description="Parsear un PDF de acta de balonmano")
async def parse_acta(file: UploadFile = File(...)):
    """
    Recibe un PDF de un acta de balonmano, lo parsea y devuelve
    los equipos con sus jugadores encontrados.
    
    No guarda nada en base de datos — solo devuelve los datos
    para que el frontend los use en la creación del partido.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser un PDF"
        )

    try:
        pdf_bytes = await file.read()
        
        # Guardar para depuración
        import os
        debug_dir = "/Users/javiertorrecilla/handStats/backend/static/uploads"
        os.makedirs(debug_dir, exist_ok=True)
        with open(os.path.join(debug_dir, "debug.pdf"), "wb") as f:
            f.write(pdf_bytes)
            
        result = parse_acta_pdf(pdf_bytes)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar el PDF: {str(e)}"
        )
