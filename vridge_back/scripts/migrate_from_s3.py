#!/usr/bin/env python
"""
Migration script to download files from S3 to local storage
Run this before deploying to Railway if you have existing files in S3
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import boto3
from django.conf import settings
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def download_s3_files():
    """Download all files from S3 to local storage"""
    
    # Check if we have AWS credentials
    if not hasattr(settings, 'AWS_ACCESS_KEY_ID'):
        logger.warning("No AWS credentials found. Skipping S3 migration.")
        return
    
    try:
        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        
        # Create local directories
        media_root = settings.MEDIA_ROOT
        static_root = settings.STATIC_ROOT
        
        os.makedirs(media_root, exist_ok=True)
        os.makedirs(static_root, exist_ok=True)
        
        # List and download files from uploads/ prefix
        logger.info("Downloading media files from S3...")
        paginator = s3_client.get_paginator('list_objects_v2')
        
        for prefix, local_dir in [('uploads/', media_root), ('static/', static_root)]:
            page_iterator = paginator.paginate(
                Bucket=bucket_name,
                Prefix=prefix
            )
            
            for page in page_iterator:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        key = obj['Key']
                        # Remove prefix from key
                        relative_path = key.replace(prefix, '', 1)
                        
                        if relative_path:
                            local_file_path = os.path.join(local_dir, relative_path)
                            
                            # Create directory if it doesn't exist
                            os.makedirs(os.path.dirname(local_file_path), exist_ok=True)
                            
                            # Download file
                            try:
                                logger.info(f"Downloading {key} to {local_file_path}")
                                s3_client.download_file(bucket_name, key, local_file_path)
                            except Exception as e:
                                logger.error(f"Failed to download {key}: {e}")
        
        logger.info("S3 migration completed successfully!")
        
    except Exception as e:
        logger.error(f"S3 migration failed: {e}")
        raise


if __name__ == "__main__":
    download_s3_files()