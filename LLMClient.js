/**
 * LLMClient 用于与 DeepSeek API 进行通信
 * 你需要将 YOUR_API_KEY 替换为你的 DeepSeek API 密钥
 * 你可以根据 DeepSeek API 文档调整 endpoint 和请求体
 */
export class LLMClient {
  /**
   * @param {string} apiKey - DeepSeek API 密钥
   * @param {string} [endpoint] - API 地址（可选，默认官方地址）
   */
  constructor(apiKey, endpoint = 'https://api.deepseek.com/v1/chat/completions') {
    this.apiKey = apiKey
    this.endpoint = endpoint
  }

  /**
   * 向 LLM 发送消息并获取回复
   * @param {Array<{role: string, content: string}>} messages - 聊天历史
   * @param {object} [options] - 其它参数（如模型名、温度等）
   * @returns {Promise<string>} - LLM 回复内容
   */
  async chat(messages, options = {}) {
    const payload = {
      model: options.model || 'deepseek-chat',
      messages,
      temperature: options.temperature || 0.7,
      ...options
    }

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`LLM API Error: ${res.status} ${errText}`)
    }

    const data = await res.json()
    // 假设 DeepSeek 返回格式为 { choices: [{ message: { content: '...' } }] }
    return data.choices?.[0]?.message?.content || ''
  }
}