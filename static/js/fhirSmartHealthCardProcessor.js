// FHIR SmartHealthCard Resource Processor
// Inspired by the IPS Resource Processor but adapted for SmartHealthCard structure

export const ResourceTypes = {
    PATIENT: 'Patient',
    ALLERGY_INTOLERANCE: 'AllergyIntolerance',
    MEDICATION_REQUEST: 'MedicationRequest',
    CONDITION: 'Condition',
    IMMUNIZATION: 'Immunization',
    PROCEDURE: 'Procedure',
    RESULT: 'DiagnosticReport',
    DEVICE: 'Device'
};

/**
 * Format dosage instructions following IPS format
 * @param {Array} dosageInstructions - Array of dosage instructions
 * @returns {string} Formatted dosage instructions
 */
function formatDosageInstructions(dosageInstructions) {
    if (!dosageInstructions || dosageInstructions.length === 0) {
        return 'No dosage instructions available.';
    }

    // We'll process the first dosage instruction (most common case)
    const instruction = dosageInstructions[0];

    // Handle "as needed" case first
    if (instruction.asNeededBoolean === true) {
        return instruction.text?.endsWith('.') ? instruction.text : (instruction.text || 'Take as needed') + '.';
    }

    // Build the instruction string
    const parts = [];

    // Add any additional instructions first
    if (instruction.additionalInstruction && instruction.additionalInstruction.length > 0) {
        const additionalText = instruction.additionalInstruction[0].text || 
                             instruction.additionalInstruction[0].coding?.[0]?.display;
        if (additionalText) {
            // Remove any trailing periods as we'll add them when joining
            parts.push(additionalText.replace(/\.+$/, ''));
        }
    }

    // Add dosage quantity if available
    const doseQuantity = instruction.doseAndRate?.[0]?.doseQuantity?.value;
    const timing = instruction.timing?.repeat;

    if (doseQuantity !== undefined && timing) {
        const frequency = timing.frequency || 1;
        const period = timing.period || 1;
        const periodUnit = timing.periodUnit || 'd';

        let timingStr = '';
        if (frequency === 1 && period === 1 && periodUnit === 'd') {
            timingStr = 'once per day';
        } else if (frequency === 2 && period === 1 && periodUnit === 'd') {
            timingStr = 'twice per day';
        } else if (frequency === 3 && period === 1 && periodUnit === 'd') {
            timingStr = 'three times per day';
        } else {
            // Convert frequency to words for 1 and 2
            const frequencyWord = frequency === 1 ? 'once' :
                                frequency === 2 ? 'twice' :
                                `${frequency} times`;
            timingStr = `${frequencyWord} per ${period} ${periodUnit}`;
        }

        parts.push(`Quantity of ${doseQuantity}, ${timingStr}`);
    }

    const result = parts.join('. ');
    return result ? result + '.' : 'No specific dosage instructions available.';
}

/**
 * Processes a FHIR resource and returns a flattened version
 * @param {Object} resource - The FHIR resource
 * @param {string} uri - The resource URI
 * @returns {Object} Flattened resource
 */
function processFhirResource(resource, uri) {
    const base = {
        uri,
        resourceType: resource.resourceType,
    };

    switch (resource.resourceType) {
        case ResourceTypes.PATIENT:
            return {
                ...base,
                name: resource.name?.[0]?.given?.join(' ') + ' ' + resource.name?.[0]?.family || 'Unknown',
                birthDate: resource.birthDate || '',
                gender: resource.gender || '',
                address: resource.address?.[0]?.line?.join(', ') || '',
                city: resource.address?.[0]?.city || '',
                country: resource.address?.[0]?.country || ''
            };

        case ResourceTypes.ALLERGY_INTOLERANCE:
            return {
                ...base,
                name: resource.code?.coding?.[0]?.display || resource.code?.text || null,
                code: resource.code?.coding?.[0]?.code || null,
                codeSystem: resource.code?.coding?.[0]?.system || null,
                criticality: resource.criticality || null,
                clinicalStatus: resource.clinicalStatus?.coding?.[0]?.code || null,
                verificationStatus: resource.verificationStatus?.coding?.[0]?.code || null,
                recordedDate: resource.recordedDate || null,
                type: resource?.type || null,
                category: resource?.category || null
            };

        case ResourceTypes.MEDICATION_REQUEST:
            const coding = resource.medicationCodeableConcept?.coding?.[0];
            const dosageInstructions = formatDosageInstructions(resource.dosageInstruction);
            
            return {
                ...base,
                intent: resource.intent || null,
                name: coding?.display || resource.medicationCodeableConcept?.text || null,
                code: coding?.code || null,
                codeSystem: coding?.system || null,
                status: resource.status || null,
                authoredOn: resource.authoredOn || null,
                dosageInstructions
            };

        case ResourceTypes.CONDITION:
            return {
                ...base,
                name: resource.code?.coding?.[0]?.display || resource.code?.text || null,
                code: resource.code?.coding?.[0]?.code || null,
                codeSystem: resource.code?.coding?.[0]?.system || null,
                clinicalStatus: resource.clinicalStatus?.coding?.[0]?.code || null,
                verificationStatus: resource.verificationStatus?.coding?.[0]?.code || null,
                onsetDateTime: resource.onsetDateTime || null
            };

        case ResourceTypes.IMMUNIZATION:
            return {
                ...base,
                name: resource.vaccineCode?.coding?.[0]?.display || resource.vaccineCode?.text || null,
                code: resource.vaccineCode?.coding?.[0]?.code || null,
                codeSystem: resource.vaccineCode?.coding?.[0]?.system || null,
                status: resource.status || null,
                date: resource.occurrenceDateTime || null
            };

        case ResourceTypes.PROCEDURE:
            return {
                ...base,
                name: resource.code?.coding?.[0]?.display || resource.code?.text || null,
                code: resource.code?.coding?.[0]?.code || null,
                codeSystem: resource.code?.coding?.[0]?.system || null,
                status: resource.status || null,
                performedStart: resource.performedPeriod?.start || null,
                performedEnd: resource.performedPeriod?.end || null
            };

        case ResourceTypes.RESULT:
            return {
                ...base,
                name: resource.code?.coding?.[0]?.display || resource.code?.text || null,
                code: resource.code?.coding?.[0]?.code || null,
                codeSystem: resource.code?.coding?.[0]?.system || null,
                status: resource.status || null,
                effectiveDateTime: resource.effectiveDateTime || null,
                value: resource.valueQuantity?.value || null,
                unit: resource.valueQuantity?.unit || null
            };

        case ResourceTypes.DEVICE:
            return {
                ...base,
                name: resource.type?.coding?.[0]?.display || resource.type?.text || null,
                code: resource.type?.coding?.[0]?.code || null,
                codeSystem: resource.type?.coding?.[0]?.system || null,
                status: resource.status || null,
                manufacturer: resource.manufacturer || null,
                model: resource.model || null,
                version: resource.version || null
            };

        default:
            return {
                ...base,
                name: `Unsupported resource type: ${resource.resourceType}`
            };
    }
}

/**
 * Process an array of SmartHealthCard credentials
 * @param {Array} smartHealthCardCredentials - Array of SmartHealthCard credentials
 * @returns {Object} Processed resources grouped by type
 */
export function processSmartHealthCardCredentials(smartHealthCardCredentials) {
    const processedResources = {
        patient: null,
        allergies: [],
        medications: [],
        conditions: [],
        immunizations: [],
        procedures: [],
        results: [], // Added results array
        devices: [], // Added devices array
        other: []
    };

    smartHealthCardCredentials.forEach(vc => {
        if (vc.credentialSubject?.fhirBundle?.entry) {
            vc.credentialSubject.fhirBundle.entry.forEach(entry => {
                const resource = entry.resource;
                const flatResource = processFhirResource(resource, entry.fullUrl);

                switch (resource.resourceType) {
                    case ResourceTypes.PATIENT:
                        if (!processedResources.patient) {
                            processedResources.patient = flatResource;
                        }
                        break;
                    case ResourceTypes.ALLERGY_INTOLERANCE:
                        processedResources.allergies.push(flatResource);
                        break;
                    case ResourceTypes.MEDICATION_REQUEST:
                        processedResources.medications.push(flatResource);
                        break;
                    case ResourceTypes.CONDITION:
                        processedResources.conditions.push(flatResource);
                        break;
                    case ResourceTypes.IMMUNIZATION:
                        processedResources.immunizations.push(flatResource);
                        break;
                    case ResourceTypes.PROCEDURE:
                        processedResources.procedures.push(flatResource);
                        break;
                    case ResourceTypes.RESULT:
                        processedResources.results.push(flatResource); // Added results case
                        break;
                    case ResourceTypes.DEVICE:
                        processedResources.devices.push(flatResource); // Added devices case
                        break;
                    default:
                        processedResources.other.push(flatResource);
                }
            });
        }
    });

    return processedResources;
}
