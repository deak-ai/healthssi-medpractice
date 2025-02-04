// Health Information Presentation Component
export class HealthInfoPresentation {
    constructor(container) {
        this.container = container;
        this.sections = {
            patient: { title: 'Patient Information', icon: 'user' },
            allergies: { title: 'Allergies', icon: 'exclamation-triangle' },
            medications: { title: 'Medications', icon: 'prescription' },
            conditions: { title: 'Conditions', icon: 'heart' },
            immunizations: { title: 'Immunizations', icon: 'syringe' },
            procedures: { title: 'Procedures', icon: 'procedures' },
            results: { title: 'Test Results', icon: 'flask' },
            devices: { title: 'Medical Devices', icon: 'stethoscope' }
        };
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getStatusBadgeClass(status) {
        const statusMap = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            final: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
        };
        return `text-xs font-medium px-2.5 py-0.5 rounded-full ${statusMap[status?.toLowerCase()] || statusMap.inactive}`;
    }

    renderPatientCard(patient) {
        return `
            <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 mb-4">
                <div class="flex items-center mb-4">
                    <div class="inline-flex items-center justify-center w-8 h-8 mr-3 text-blue-500 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-300">
                        <i class="fas fa-${this.sections.patient.icon}"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${this.sections.patient.title}</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${patient.name}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            <span class="font-semibold">Date of Birth:</span> ${this.formatDate(patient.birthDate)}<br>
                            <span class="font-semibold">Gender:</span> ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                        </p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            <span class="font-semibold">Address:</span> ${patient.address}<br>
                            <span class="font-semibold">City:</span> ${patient.city}, ${patient.country}
                        </p>
                    </div>
                </div>
            </div>`;
    }

    renderSection(sectionData, sectionKey) {
        if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) {
            return '';
        }

        const { title, icon } = this.sections[sectionKey];

        const renderListItem = (item, extraContent = '') => `
            <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 mb-4">
                <div class="flex items-center justify-between mb-2">
                    <h5 class="text-base font-semibold text-gray-900 dark:text-white">${item.name}</h5>
                    ${item.status ? `<span class="${this.getStatusBadgeClass(item.status)}">${item.status}</span>` : ''}
                </div>
                ${extraContent}
            </div>`;

        const content = sectionData.map(item => {
            let extraContent = '<p class="text-sm text-gray-500 dark:text-gray-400">';
            
            switch (sectionKey) {
                case 'allergies':
                    extraContent += `
                        <span class="font-semibold">Criticality:</span> 
                        <span class="${this.getStatusBadgeClass(item.criticality)}">${item.criticality}</span><br>
                        <span class="font-semibold">Status:</span> ${item.clinicalStatus} (${item.verificationStatus})<br>
                        <span class="font-semibold">Recorded:</span> ${this.formatDate(item.recordedDate)}`;
                    break;
                case 'medications':
                    extraContent += `
                        <span class="font-semibold">Instructions:</span> ${item.dosageInstructions}<br>
                        <span class="font-semibold">Prescribed:</span> ${this.formatDate(item.authoredOn)}`;
                    break;
                case 'conditions':
                    extraContent += `
                        <span class="font-semibold">Status:</span> ${item.clinicalStatus} (${item.verificationStatus})<br>
                        <span class="font-semibold">Onset:</span> ${this.formatDate(item.onsetDateTime)}`;
                    break;
                case 'immunizations':
                    extraContent += `<span class="font-semibold">Date:</span> ${this.formatDate(item.date)}`;
                    break;
                case 'procedures':
                    extraContent += `
                        <span class="font-semibold">Date:</span> ${this.formatDate(item.performedStart)}
                        ${item.performedEnd ? ` - ${this.formatDate(item.performedEnd)}` : ''}`;
                    break;
                case 'results':
                    if (item.value) {
                        extraContent += `<span class="font-semibold">Value:</span> ${item.value} ${item.unit || ''}<br>`;
                    }
                    extraContent += `<span class="font-semibold">Date:</span> ${this.formatDate(item.effectiveDateTime)}`;
                    break;
                case 'devices':
                    if (item.manufacturer) extraContent += `<span class="font-semibold">Manufacturer:</span> ${item.manufacturer}<br>`;
                    if (item.model) extraContent += `<span class="font-semibold">Model:</span> ${item.model}<br>`;
                    if (item.version) extraContent += `<span class="font-semibold">Version:</span> ${item.version}`;
                    break;
            }
            extraContent += '</p>';
            
            return renderListItem(item, extraContent);
        }).join('');

        return `
            <div class="mb-4">
                <div class="flex items-center mb-4">
                    <div class="inline-flex items-center justify-center w-8 h-8 mr-3 text-blue-500 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-300">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        ${title}
                        ${Array.isArray(sectionData) ? `<span class="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">(${sectionData.length})</span>` : ''}
                    </h3>
                </div>
                ${content}
            </div>`;
    }

    render(healthInfo) {
        const sections = Object.keys(this.sections);
        let html = '';

        // Hide QR code when health info is available
        const qrCodeDisplay = document.getElementById('qrCodeDisplay');
        if (qrCodeDisplay && healthInfo) {
            qrCodeDisplay.classList.add('hidden');
        }

        // Show health info container
        this.container.classList.remove('hidden');

        // Render patient card first
        if (healthInfo.patient) {
            html += this.renderPatientCard(healthInfo.patient);
        }

        // Create a container for the remaining sections in a 2-column layout
        html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">';
        sections.forEach(section => {
            if (section !== 'patient') {
                const sectionHtml = this.renderSection(healthInfo[section], section);
                if (sectionHtml) {
                    html += `<div>${sectionHtml}</div>`;
                }
            }
        });
        html += '</div>';

        this.container.innerHTML = html;
    }
}
