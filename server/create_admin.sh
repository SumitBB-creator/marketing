#!/bin/bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "full_name": "Admin User",
    "role": "admin"
  }'
echo ""
echo "Admin user created: admin@example.com / password123"
