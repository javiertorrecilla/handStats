import os

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

# Configuración Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


def delete_image(public_id):
    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image"
        )

        print(f"{public_id}: {result}")

    except Exception as e:
        print(f"Error eliminando {public_id}: {e}")


# Lista de imágenes a borrar
imagenes = [
    "handstats/teams/zl6eagfrkjvvxewkhmdh",
    "handstats/teams/mi_logo",
]


for img in imagenes:
    delete_image(img)