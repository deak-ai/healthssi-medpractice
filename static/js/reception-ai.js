import { proxy, subscribe } from 'https://cdn.jsdelivr.net/npm/valtio@1.12.0/+esm'
import { 
  initialize_ssi_presentation,
  generate_qr_code,
  byte_array_to_image_url,
  parseOpenId4VpUri,
  subscribe_to_notifications
} from './pis-api-functions.mjs'

// State management
const state = proxy({
  isSessionActive: false,
  events: [],
  qrCodeData: null,
  healthInfo: null,
  presentationUri: null
})

// Constants for health info states
const HEALTH_INFO_STATES = {
  INITIAL: 'initial',
  QR_CODE: 'qr_code',
  HEALTH_INFO: 'health_info'
}

const HEALTH_INFO_MESSAGES = {
  [HEALTH_INFO_STATES.INITIAL]: "Talk to me if you have a need to register your health information",
  [HEALTH_INFO_STATES.QR_CODE]: "Please scan this QR Code to present your health information",
  [HEALTH_INFO_STATES.HEALTH_INFO]: "Thank you for providing me your health information"
}

// Function to reset prescription state
function resetHealthInfoState() {
  state.qrCodeData = null;
  state.healthInfo = null;
  state.presentationUri = null;
  updateHealthInfoDisplay();
}

// Function to get current health info state
function getCurrentHealthInfoState() {
  if (state.healthInfo) return HEALTH_INFO_STATES.HEALTH_INFO;
  if (state.qrCodeData) return HEALTH_INFO_STATES.QR_CODE;
  return HEALTH_INFO_STATES.INITIAL;
}

// Function to fetch medication details
async function fetchMedicationDetails(gtin) {
  try {
    // First fetch to get the PID
    const response = await fetch(`https://med.mymedi.ch/search/quick/terms/${gtin}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No medication details found');
    }
    
    return data[0].pid; // Return the PID from the first result
  } catch (error) {
    console.error('Error fetching medication details:', error);
    throw error;
  }
}

// Function to update prescription display
function updateHealthInfoDisplay() {
  const currentState = getCurrentHealthInfoState();
  const message = HEALTH_INFO_MESSAGES[currentState];
  
  // Update the instruction text in the header
  const healthInfoInstructionElement = document.querySelector('.p-4.border-b p.text-sm');
  if (healthInfoInstructionElement) {
    healthInfoInstructionElement.textContent = message;
  }

  const qrCodeDisplay = document.getElementById('qrCodeDisplay');
  if (!qrCodeDisplay) return;

  // Check if we need to update the display
  const existingFrame = document.getElementById('medicationFrame');
  if (currentState === HEALTH_INFO_STATES.HEALTH_INFO) {
    return; // Already showing correct content
  }

  switch (currentState) {
    case HEALTH_INFO_STATES.HEALTH_INFO:
      if (state.healthInfo) {
        qrCodeDisplay.innerHTML = `
          <div class="flex flex-col items-center justify-center w-full">
            <div class="w-full max-w-xl">
              <pre class="bg-gray-100 p-4 rounded-lg w-full font-mono text-sm whitespace-pre-wrap break-all" style="word-break: break-all; overflow-wrap: anywhere; max-width: 100%; white-space: pre-wrap;">${JSON.stringify(state.healthInfo, null, 2)}</pre>
            </div>
          </div>
        `;
      }
      break;

    case HEALTH_INFO_STATES.QR_CODE:
      qrCodeDisplay.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full">
          <div class="w-full max-w-xl flex items-center justify-center mb-4">
            <img src="${state.qrCodeData}" alt="QR Code" class="w-full h-auto"/>
          </div>
          <div class="w-full max-w-xl">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-start gap-2">
                <p class="text-xs text-gray-600 font-mono break-all flex-grow" style="word-break: break-all; overflow-wrap: anywhere; max-width: 100%; white-space: pre-wrap;">${state.presentationUri}</p>
                <button 
                  id="copyButton"
                  class="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Copy URL to clipboard"
                >
                  <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 12">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2h4a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4m6 0a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1m6 0v3H6V2M5 5h8m-8 5h8m-8 4h8"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add click handler after the element is in the DOM
      const copyButton = document.getElementById('copyButton');
      if (copyButton) {
        copyButton.addEventListener('click', () => copyToClipboard(state.presentationUri));
      }
      break;

    default: // INITIAL state
      qrCodeDisplay.innerHTML = `<div class="flex items-center justify-center min-h-[200px]"></div>`;
      break;
  }
}

// WebRTC connection
let peerConnection = null
let dataChannel = null
let audioElement = null

async function startSession() {
  try {
    // Get token from our API endpoint
    const tokenResponse = await fetch('/api/token/index.json')
    if (!tokenResponse.ok) {
      throw new Error(`HTTP error! status: ${tokenResponse.status}`)
    }
    const data = await tokenResponse.json()
    const token = data.token
    
    if (!token) {
      throw new Error('No API token available')
    }

    // Create peer connection
    const pc = new RTCPeerConnection()
    
    // Set up audio element for model's voice
    audioElement = document.createElement('audio')
    audioElement.autoplay = true
    pc.ontrack = (e) => audioElement.srcObject = e.streams[0]
    
    // Add local audio track for microphone input
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true
    })
    pc.addTrack(ms.getTracks()[0])
    
    // Set up data channel
    const dc = pc.createDataChannel('oai-events')
    dataChannel = dc
    
    dc.onmessage = async (e) => {
      const event = JSON.parse(e.data)
      const eventWithTimestamp = {
        ...event,
        timestamp: new Date().toLocaleTimeString()
      }
      state.events = [eventWithTimestamp, ...state.events]
      
      // Handle function calls and color palette updates
      if (event.type === 'response.done' && event.response.output) {
        event.response.output.forEach(output => {
          if (output.type === 'function_call') {
            if (output.name === 'present_qr_code') {
              try {
                handleHealthInfoPresentation()
                  .then(() => {
                    // Ask for feedback after QR code is displayed
                    setTimeout(() => {
                      sendClientEvent({
                        type: "response.create",
                        response: {
                          instructions: "ask them to scan the QR code with their SSI wallet to securely present their health information"
                        }
                      })
                    }, 500)
                  })
                  .catch(e => {
                    console.error('Failed to handle QR code generation:', e)
                  })
              } catch (e) {
                console.error('Failed to handle QR code generation:', e)
              }
            } else if (output.name === 'reset_health_info') {
              try {
                resetHealthInfoState();
                // Confirm the reset
                setTimeout(() => {
                  sendClientEvent({
                    type: "response.create",
                    response: {
                      instructions: "Ask them how else you can be of assistance, stating your capabilities with the exception of resetting the health info state"
                    }
                  })
                }, 500)
              } catch (e) {
                console.error('Failed to reset health info state:', e)
              }
            }
          }
        })
      }
    }
    
    // Create and send offer
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    
    const baseUrl = 'https://api.openai.com/v1/realtime'
    const model = 'gpt-4o-realtime-preview-2024-12-17'
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/sdp'
      }
    })
    
    const answer = {
      type: 'answer',
      sdp: await sdpResponse.text()
    }
    await pc.setRemoteDescription(answer)
    
    peerConnection = pc
    state.error = null
    
    // Set session active when data channel opens
    dc.addEventListener('open', () => {
      state.isSessionActive = true
      state.events = []
      
      // Send function definition
      sendClientEvent({
        type: "session.update",
        session: {
          tools: [
            {
              type: "function",
              name: "present_qr_code",
              // break the below string into multiple lines to make it more readable
              description: "Call this function when a user asks about a registering their health information." 
                  +"This will allow you to generate a QR code to show the user which they can then scan with their SSI wallet in order to securelypresent their health information. "
                  +"The underlying flow is an OpenID4VP presentation flow, but don't bore the user with these details, just so you know. "
                  +"Also, this means that none of the users information will be sent to you, it stays securely within the system.",
              parameters: {
                type: "object",
                strict: true,
                properties: {},
                required: [],
              },
            },
            {
              type: "function",
              name: "reset_health_info",
              description: "Call this function to reset the health info state",
              parameters: {
                type: "object",
                strict: true,
                properties: {},
                required: [],
              },
            },
          ],
          tool_choice: "auto",
        },
      })
    })
  } catch (error) {
    console.error('Failed to start session:', error)
    state.error = error.message
    state.isSessionActive = false
  }
}

function stopSession() {
  if (dataChannel) {
    dataChannel.close()
  }
  if (peerConnection) {
    peerConnection.close()
  }
  if (audioElement) {
    audioElement.srcObject = null
  }
  
  state.isSessionActive = false
  dataChannel = null
  peerConnection = null
  audioElement = null
  state.error = null
}

function sendClientEvent(message) {
  if (dataChannel) {
    message.event_id = message.event_id || crypto.randomUUID()
    const messageToSend = { ...message }
    dataChannel.send(JSON.stringify(messageToSend))
    message.timestamp = new Date().toLocaleTimeString()
    state.events = [message, ...state.events]
  } else {
    console.error('Failed to send message - no data channel available', message)
  }
}

function sendTextMessage(message) {
  const event = {
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: message
        }
      ]
    }
  }
  
  sendClientEvent(event)
  sendClientEvent({ type: 'response.create' })
}

// Function to handle prescription presentation
async function handleHealthInfoPresentation() {
  try {
    // Initialize prescription presentation
    const presentationUri = await initialize_ssi_presentation("SmartHealthCard");
    state.presentationUri = presentationUri;
    
    // Parse the URI to get stateId
    const params = parseOpenId4VpUri(presentationUri);
    const stateId = params.state;
    
    if (!stateId) {
      throw new Error('No state ID found in presentation URI');
    }
    
    // Generate and display QR code
    const qrCodeBytes = await generate_qr_code(presentationUri);
    state.qrCodeData = byte_array_to_image_url(qrCodeBytes);
    
    // Set up WebSocket subscription for status updates
    console.log("Subscribing to WebSocket for stateId: ", stateId)
    const messageHandler = async (event) => {
      try {
        // Check for prescription data by looking for key fields
        console.log("Received health info: ", event)
        
        // Process verification results
        if (event.policyResults && event.policyResults.results) {
          const results = event.policyResults.results;
          const smartHealthCardCredentials = [];
          
          for (const result of results) {
            if (result.credential === "VerifiablePresentation") {
              const vpResult = result.policyResults[0];
              console.log("VerifiablePresentation verification success:", vpResult.is_success);
            } else if (result.credential === "SmartHealthCard") {
              const policyResult = result.policyResults[0];
              if (policyResult && policyResult.result && policyResult.result.vc) {
                smartHealthCardCredentials.push(policyResult.result.vc);
              }
            }
          }
          
          console.log("Extracted credential subjects:", smartHealthCardCredentials);
          state.healthInfo = smartHealthCardCredentials;

          // Send message about robot delivery
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: "Now say thank you to the user for providing their health info and to take a seat in the waiting room. "
                + "The Doctor will be with them shortly"
              }
            })
          }, 500)
        }
      } catch (error) {
        console.error('Error handling health info: ', error)
      }
    };
    
    // Subscribe to notifications using the stateId
    subscribe_to_notifications(stateId, messageHandler);
    
  } catch (error) {
    console.error('Error in health info presentation:', error);
    state.error = `Failed to handle health info presentation: ${error.message}`;
  }
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    // Show a temporary success message
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
      copyButton.classList.remove('bg-gray-100', 'hover:bg-gray-200');
      copyButton.classList.add('bg-green-100', 'text-green-700');
      
      // Update the icon to a checkmark
      copyButton.innerHTML = `
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
        </svg>
      `;
      
      setTimeout(() => {
        copyButton.classList.remove('bg-green-100', 'text-green-700');
        copyButton.classList.add('bg-gray-100', 'hover:bg-gray-200');
        // Restore the clipboard icon
        copyButton.innerHTML = `
          <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2h4a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4m6 0a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1m6 0v3H6V2M5 5h8m-8 5h8m-8 4h8"/>
          </svg>
        `;
      }, 2000);
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

// UI Updates
function updateUI() {
  const button = document.getElementById('toggleSession')
  const errorDisplay = document.getElementById('errorDisplay')
  const eventLog = document.getElementById('eventLog')

  if (!button || !eventLog || !errorDisplay) return

  // Update button text and style
  button.textContent = state.isSessionActive ? 'Stop Session' : 'Start Session'
  button.classList.toggle('bg-red-600', state.isSessionActive)
  button.classList.toggle('hover:bg-red-700', state.isSessionActive)
  button.classList.toggle('bg-primary-700', !state.isSessionActive)
  button.classList.toggle('hover:bg-primary-800', !state.isSessionActive)

  // Update error display
  if (state.error) {
    errorDisplay.textContent = state.error
    errorDisplay.classList.remove('hidden')
  } else {
    errorDisplay.classList.add('hidden')
  }
  
  // Update prescription display
  updateHealthInfoDisplay();
  
  // Update event log
  eventLog.innerHTML = state.events.map(event => {
    const isClient = event.event_id && !event.event_id.startsWith('event_')
    return `
      <div class="mb-2">
        <div class="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-700 transition-colors cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
          <span class="${isClient ? 'text-blue-400' : 'text-green-400'}">${isClient ? '↓' : '↑'}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            ${isClient ? 'client:' : 'server:'} ${event.type} | ${event.timestamp}
          </span>
        </div>
        <div class="hidden">
          <pre class="whitespace-pre-wrap break-words text-xs p-2 mt-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors">${JSON.stringify(event, null, 2)}</pre>
        </div>
      </div>
    `
  }).join('')
  eventLog.scrollTop = eventLog.scrollHeight
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  subscribe(state, updateUI)
  
  document.getElementById('toggleSession').addEventListener('click', () => {
    if (state.isSessionActive) {
      stopSession()
    } else {
      startSession()
    }
  })
})

export { startSession, stopSession, sendClientEvent, sendTextMessage, state }
