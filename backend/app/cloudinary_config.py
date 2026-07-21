import os

from dotenv import load_dotenv

import cloudinary
import cloudinary.uploader

load_dotenv()


cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

print("Cloudinary configured with URL:", os.getenv("CLOUDINARY_URL"))


def upload_image(file):
    return cloudinary.uploader.upload(
        file,
        folder="handstats/teams",
        resource_type="image"
    )