# Text Classifier with OpenAI API

This is a simple web application that uses the OpenAI GPT-4 API to classify text into different categories.

## Features

- Classify text into predefined categories (sentiment, content type, topic, intent)
- Create custom classification categories
- Get detailed results with confidence scores and explanations
- Per-field feedback and optimization
- Simple and intuitive user interface

## Setup

1. Make sure you have Node.js installed on your machine
2. Clone this repository
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

5. Open your browser and navigate to: http://localhost:3000/classify.html

## Usage

1. Enter your OpenAI API key (you can get one from https://platform.openai.com/api-keys)
2. Enter the text you want to classify
3. Select a classification type:
   - Choose from predefined categories (sentiment, content type, topic, intent)
   - Or define your own custom categories (comma-separated)
4. You can:
   - Click "Classify Text" button for full classification
   - Click "Classify Text Only" to get feedback on your text
   - Click "Validate Categories" to check your custom categories
5. View the detailed classification results

## How it Works

The application uses a Node.js server to proxy requests to the OpenAI API, avoiding CORS issues. The classification is performed by GPT-4, OpenAI's powerful language model.

The app provides:
- A primary classification with confidence score
- Breakdown of all category scores
- Explanation of the classification decision
- Per-field feedback and optimization options

## Privacy

Your API key is stored only in your browser's local storage and is never saved on our servers. All API requests are made directly from your browser to the OpenAI API through our proxy server.

## Requirements

- Node.js 14+
- A valid OpenAI API key