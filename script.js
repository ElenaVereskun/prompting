// История чата
let chatHistory = [];

function renderChatHistory() {
  const chatBlock = document.getElementById("chat-history");
  if (!chatBlock) return;
  chatBlock.innerHTML = chatHistory
    .map((msg) => {
      if (msg.role === "user") {
        return `<div class="chat-message user"><b>Вы:</b> ${msg.content}</div>`;
      } else if (msg.role === "assistant") {
        return `<div class="chat-message ai"><b>AI:</b> ${msg.content}</div>`;
      }
      return "";
    })
    .join("");
}

document.getElementById("send-btn").onclick = async function () {
  const input = document.getElementById("user-input").value;
  const temperature =
    parseFloat(document.getElementById("temperature").value) || 1;
  const maxTokens =
    parseInt(document.getElementById("max-tokens").value) || 512;
  document.getElementById("response").innerText = "Thinking...";

  // Добавляем сообщение пользователя в историю
  chatHistory.push({ role: "user", content: input });
  renderChatHistory();

  request = {
    model: "lakomoor/vikhr-llama-3.2-1b-instruct:1b",
    messages: [
      {
        role: "system",
        content: `Ты консультант фирмы по продаже квартир. Поприветствуй пользователя. 
        Определи тип запроса: заказ, жалоба или вопрос. Если это жалоба, передай что жалоба передана начальству 
        и мы решим в ближайшее время и дадим обратную связь. Если это заказ, поблагодари 
        Если это вопрос, отвечай вежливо и рекомендуй продукты нашей компании 
        Пользователь спрашивает:`,
      },
      {
        role: "user",
        content: `${input}`,
      },
    ],
    temperature: temperature,
    max_tokens: maxTokens,
  };

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok || !response.body) {
      throw new Error("API not available");
    }
    // Read the response as a stream
    const reader = response.body.getReader();
    let result = "";
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      try {
        let chunk = decoder.decode(value, { stream: true });
        let response_chunk = JSON.parse(chunk);
        if (response_chunk.message && response_chunk.message.content) {
          result += response_chunk.message.content;
        }
      } catch (e) {
        console.log(e);
      }
    }
    console.log(result);
    document.getElementById("response").innerText =
      result || "No response from AI.";
    // Добавляем ответ AI в историю
    chatHistory.push({
      role: "assistant",
      content: result || "No response from AI.",
    });
    renderChatHistory();
  } catch (e) {
    document.getElementById("response").innerText =
      "Сервис не доступен, попробуйте отправить запрос попозже.";
    // Добавляем ошибку в историю
    chatHistory.push({
      role: "assistant",
      content: "Сервис не доступен, попробуйте отправить запрос попозже.",
    });
    renderChatHistory();
    console.log(e);
  }
};

// Add Enter key support for textarea
document
  .getElementById("user-input")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      document.getElementById("send-btn").click();
    }
  });
