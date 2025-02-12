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
  prescriptionData: null,
  presentationUri: null
})

// Constants for prescription states
const PRESCRIPTION_STATES = {
  INITIAL: 'initial',
  QR_CODE: 'qr_code',
  PRESCRIPTION: 'prescription'
}

const PRESCRIPTION_MESSAGES = {
  [PRESCRIPTION_STATES.INITIAL]: "Talk to me if you have a prescription",
  [PRESCRIPTION_STATES.QR_CODE]: "Please scan this QR Code to present your prescription",
  [PRESCRIPTION_STATES.PRESCRIPTION]: "Thank you for providing me your prescription"
}

// Function to reset prescription state
function resetPrescriptionState() {
  state.qrCodeData = null;
  state.prescriptionData = null;
  state.presentationUri = null;
  updatePrescriptionDisplay();
}

// Function to get current prescription state
function getCurrentPrescriptionState() {
  if (state.prescriptionData) return PRESCRIPTION_STATES.PRESCRIPTION;
  if (state.qrCodeData) return PRESCRIPTION_STATES.QR_CODE;
  return PRESCRIPTION_STATES.INITIAL;
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
    } else { 
      console.log("Received medication details:", data);
    }
    
    return data[0].pid; // Return the PID from the first result
  } catch (error) {
    console.error('Error fetching medication details:', error);
    throw error;
  }
}

// Function to update prescription display
function updatePrescriptionDisplay() {
  const currentState = getCurrentPrescriptionState();
  const message = PRESCRIPTION_MESSAGES[currentState];
  
  // Update the instruction text in the header
  const prescriptionInstructionElement = document.querySelector('.p-4.border-b p.text-sm');
  if (prescriptionInstructionElement) {
    prescriptionInstructionElement.textContent = message;
  }

  const qrCodeDisplay = document.getElementById('qrCodeDisplay');
  if (!qrCodeDisplay) return;

  // Check if we need to update the display
  const existingFrame = document.getElementById('medicationFrame');
  if (currentState === PRESCRIPTION_STATES.PRESCRIPTION && 
      state.prescriptionData?.medicationPid && 
      existingFrame?.src.includes(state.prescriptionData.medicationPid)) {
    return; // Frame already showing correct content
  }

  switch (currentState) {
    case PRESCRIPTION_STATES.PRESCRIPTION:
      if (state.prescriptionData) {
        if (state.prescriptionData.medicationPid) {
          qrCodeDisplay.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full h-full flex-1">
              <div class="w-full h-full relative">
                <div class="bg-white h-full">
                  <div id="iframeLoader" class="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div role="status" class="inline-block">
                      <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-primary-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                      </svg>
                      <span class="sr-only">Loading...</span>
                    </div>
                  </div>
                  <iframe 
                    id="medicationFrame"
                    src="https://med.mymedi.ch/article/show/${state.prescriptionData.medicationPid}"
                    class="w-full h-full relative z-10 opacity-0 transition-opacity duration-300"
                    style="border: 0; display: block; min-height: calc(100vh - 20rem);"
                    title="Medication Information"
                    onload="this.classList.remove('opacity-0')"
                  >
                  </iframe>
                </div>
              </div>
            </div>
          `;
        } else if (state.prescriptionData.medicationRefData?.gtin) {
          // Show loading state while fetching PID
          qrCodeDisplay.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full h-full">
              <div role="status" class="inline-block">
                <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-primary-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span class="sr-only">Loading medication details...</span>
              </div>
              <p class="mt-2 text-sm text-gray-500">Loading medication details...</p>
            </div>
          `;
        } else {
          // Fallback to just showing prescription data if no GTIN available
          qrCodeDisplay.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full">
              <div class="w-full max-w-xl">
                <pre class="bg-gray-100 p-4 rounded-lg w-full font-mono text-sm whitespace-pre-wrap break-all" style="word-break: break-all; overflow-wrap: anywhere; max-width: 100%; white-space: pre-wrap;">${JSON.stringify(state.prescriptionData, null, 2)}</pre>
              </div>
            </div>
          `;
        }
      }
      break;

    case PRESCRIPTION_STATES.QR_CODE:
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
                handlePrescriptionPresentation()
                  .then(() => {
                    // Ask for feedback after QR code is displayed
                    setTimeout(() => {
                      sendClientEvent({
                        type: "response.create",
                        response: {
                          instructions: "ask them to scan the QR code with their SSI wallet present their prescription"
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
            } else if (output.name === 'reset_prescription') {
              try {
                resetPrescriptionState();
                // Confirm the reset
                setTimeout(() => {
                  sendClientEvent({
                    type: "response.create",
                    response: {
                      instructions: "Ask them how else you can be of assistance, stating your capabilities with the exception of resetting the prescription state"
                    }
                  })
                }, 500)
              } catch (e) {
                console.error('Failed to reset prescription state:', e)
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
              description: "Call this function when a user asks about a prescription (note this is not a real medical prescription)." 
                  +"This will allow you to generate a QR code to show the user which they can then scan with their SSI wallet in order to present their prescription."
                  +"The underlying flow is an OpenID4VP presentation flow, but don't bore the user with these details, just so you know.",
              parameters: {
                type: "object",
                strict: true,
                properties: {},
                required: [],
              },
            },
            {
              type: "function",
              name: "reset_prescription",
              description: "Call this function to reset the prescription state",
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
async function handlePrescriptionPresentation() {
  try {
    // Initialize prescription presentation
    const presentationUri = await initialize_ssi_presentation("SwissMedicalPrescription");
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
    const messageHandler = async (event) => {
      try {
        // Check for prescription data by looking for key fields
        if (event.prescriptionId && event.medicationRefData) {
          // Store the prescription data and update PID atomically
          const prescriptionUpdate = { ...event };
          
          // Fetch medication details if GTIN is available
          if (event.medicationRefData?.gtin) {
            try {
              const pid = await fetchMedicationDetails(event.medicationRefData.gtin);
              prescriptionUpdate.medicationPid = pid;
            } catch (error) {
              console.error('Error fetching medication details:', error);
            }
          }
          
          // Update state once with all changes
          state.prescriptionData = prescriptionUpdate;
          
          // Send message about robot delivery
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: "Now say thank you to the user for providing their prescription and tell them"
                +" that a friendly robots will hand it to them shortly."
              }
            })
          }, 500)
        }
      } catch (error) {
        console.error('Error handling prescription data:', error)
      }
    };
    
    // Subscribe to notifications using the stateId
    subscribe_to_notifications(stateId, messageHandler);
    
  } catch (error) {
    console.error('Error in prescription presentation:', error);
    state.error = `Failed to handle prescription presentation: ${error.message}`;
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
  updatePrescriptionDisplay();
  
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
