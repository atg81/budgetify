const apiKey = "AIzaSyCQ0gRnPkA-dzjZBCTDEjop4tT3xVhii84";

async function testGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
  });
  const data = await response.text();
  console.log("Status:", response.status);
  console.log("Data:", data);
}
testGemini();
