const apiKey = "AIzaSyCQ0gRnPkA-dzjZBCTDEjop4tT3xVhii84";
async function listModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  data.models.forEach(m => console.log(m.name, "-", m.supportedGenerationMethods));
}
listModels();
