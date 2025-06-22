import { SecretManager } from './SecretManager.js'
const secretManager = new SecretManager()
const apiKey = await secretManager.getSecret('deepseek_api_key')
console.log(apiKey)
import { LLMClient } from './LLMClient.js'
const llm = new LLMClient(apiKey)
const reply = await llm.chat([{ role: 'user', content: '你好，介绍一下你自己' }])
console.log(reply)