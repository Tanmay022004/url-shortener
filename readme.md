# URL Shortener Project

## Live Demo
https://your-app.onrender.com

---

## What this project does
This project shortens long URLs into short links and redirects users to the original URL.

It also tracks clicks and supports link expiry.

---

## Features
- Shorten long URLs
- Redirect using short link
- Track click count
- Expire links after 7 days
- Basic frontend UI

---

## Tech Stack
- Node.js
- Express.js
- MongoDB Atlas
- HTML/CSS/JS

---

## How it works (simple)
1. User enters a long URL
2. Server generates a short code
3. Saves it in MongoDB
4. When user opens short link:
   - system finds original URL
   - redirects user

---

## API Routes
- POST /shorten → create short URL  
- GET /:code → redirect  
- GET /analytics/:code → view clicks  

---

## Author
Built by Tanmay