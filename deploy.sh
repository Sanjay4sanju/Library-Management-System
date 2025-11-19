#!/bin/bash

# Deployment script for Digital Ocean Droplet

echo "Starting deployment..."

# Backend deployment
cd /path/to/your/project/backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Restart services
sudo systemctl daemon-reload
sudo systemctl restart gunicorn
sudo systemctl restart celery
sudo systemctl restart nginx

echo "Deployment completed successfully!"