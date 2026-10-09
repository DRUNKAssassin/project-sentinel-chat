# Project Sentinel: AI Travel Concierge for J&K

**Built for the ML Empowerment Build Challenge 3.0**

Project Sentinel is an autonomous, AI-driven travel planning ecosystem designed to promote sustainable tourism in Jammu & Kashmir. By dynamically curating personalized itineraries that highlight verified "hidden gems," Sentinel helps distribute tourist wealth to local communities while reducing congestion in heavily trafficked hotspots.

This repository contains the Next.js Frontend & RAG Pipeline. The autonomous Python data scraper can be found in our companion repository.

## The Problem & Social Impact
Popular destinations in Jammu & Kashmir (like Gulmarg and Pahalgam) face severe overtourism, while stunning offbeat locations and local businesses remain undiscovered. Project Sentinel solves this by autonomously scraping travel vlogs for hidden gems and using Gemini 3.5 Flash-Lite to weave these offbeat locations into custom travel itineraries. 

## Features
* **Retrieval-Augmented Generation (RAG):** The Next.js backend fetches live, dynamically scraped data from a Google Sheets Webhook to ground the AI's recommendations in real-world, offbeat locations.
* **Empathetic AI Persona:** Powered by Gemini 3.5 Flash-Lite, the chat interface analyzes user mood, pacing, and preferences to deliver a highly personalized conversational experience.
* **Interactive Slide Deck UI:** Standard text outputs are transformed into a visually rich, day-by-day interactive itinerary deck.
* **Dynamic Image Fetching:** Integrates with the Unsplash API to pull contextual landscape imagery for each curated destination on the fly.

## Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **AI Engine:** Google Gemini 3.5 Flash-Lite API
* **Database/Webhook:** Google Apps Script & Google Sheets
* **Imagery:** Unsplash API

## How the Architecture Works
1. **The Scraper (Companion Repo):** A Python script running on GitHub Actions autonomously scrapes YouTube transcripts for J&K hidden gems and pushes the JSON data to a Google Sheet via a Webhook.
2. **The Fetch:** When a user submits a query, this Next.js app hits a GET endpoint on that same Google Sheet to pull the latest scraped locations into local context.
3. **The Generation:** The user's query and the live database are passed to Gemini 3.5 Flash-Lite via a strict system prompt. Gemini acts as an intelligent router, matching the user's vibe with a hidden gem and generating a structured JSON itinerary.
4. **The Render:** The Next.js frontend parses the JSON and renders both a customized greeting and an interactive UI deck.

## Local Setup

1. **Clone the repository:**
git clone https://github.com/DRUNKAssassin/project-sentinel-chat.git
cd project-sentinel-chat

2. **Install dependencies:**
npm install

3. **Set up environment variables:**
Create a .env file in the root directory and add your API keys:
GEMINI_API_KEY=your_gemini_api_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here

4. **Run the development server:**
npm run dev

Open http://localhost:3000 to view the application.