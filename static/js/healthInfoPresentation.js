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
            <div class="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 mb-4">
                <div class="flex flex-col mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">${patient.name}</h2>
                    <div class="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span class="flex items-center">
                            <i class="fas fa-user mr-2"></i>
                            ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-2"></i>
                            Born ${this.formatDate(patient.birthDate)}
                        </span>
                        ${patient.language ? `
                        <span class="flex items-center">
                            <i class="fas fa-language mr-2"></i>
                            ${patient.language}
                        </span>
                        ` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <div class="flex-shrink-0 mt-1">
                                <i class="fas fa-map-marker-alt text-blue-500"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Address</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    ${patient.address}<br>
                                    ${patient.city}${patient.state ? `, ${patient.state}` : ''}<br>
                                    ${patient.country}
                                </p>
                            </div>
                        </div>

                        ${patient.telecom ? `
                        <div class="flex items-start gap-3">
                            <div class="flex-shrink-0 mt-1">
                                <i class="fas fa-phone text-blue-500"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    ${patient.telecom}
                                </p>
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="space-y-4">
                        ${patient.medicalRecordNumber ? `
                        <div class="flex items-start gap-3">
                            <div class="flex-shrink-0 mt-1">
                                <i class="fas fa-hospital text-blue-500"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Medical Record Number</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    ${patient.medicalRecordNumber}
                                </p>
                            </div>
                        </div>
                        ` : ''}

                        ${patient.socialSecurityNumber ? `
                        <div class="flex items-start gap-3">
                            <div class="flex-shrink-0 mt-1">
                                <i class="fas fa-id-card text-blue-500"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Social Security Number</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    ${patient.socialSecurityNumber}
                                </p>
                            </div>
                        </div>
                        ` : ''}
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
            <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
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
                <div class="health-info-grid">
                    ${content}
                </div>
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

        // Add grid styles
        html += `
            <style>
                .health-info-grid {
                    display: grid;
                    grid-template-columns: repeat(var(--optimal-columns, 1), minmax(var(--min-card-width, 300px), var(--max-card-width, 1fr)));
                    gap: 1rem;
                    justify-content: start;
                }
            </style>
        `;

        // Render patient card first
        if (healthInfo.patient) {
            html += this.renderPatientCard(healthInfo.patient);
        }

        // Create a container for the remaining sections
        html += '<div class="grid grid-cols-1 gap-4">';
        sections.forEach(section => {
            if (section !== 'patient') {
                const sectionHtml = this.renderSection(healthInfo[section], section);
                if (sectionHtml) {
                    html += sectionHtml;
                }
            }
        });
        html += '</div>';

        this.container.innerHTML = html;

        // After render, calculate and set optimal column count
        this.updateGridLayout();
        
        // Update on resize
        window.removeEventListener('resize', this.updateGridLayout.bind(this));
        window.addEventListener('resize', this.updateGridLayout.bind(this));
    }

    updateGridLayout() {
        const container = this.container;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const minCardWidth = 300; // Minimum card width
        const gap = 16; // 1rem gap
        
        // Calculate how many columns can fit
        const maxPossibleColumns = Math.floor((containerWidth + gap) / (minCardWidth + gap));
        
        // Find all grids and their item counts
        const grids = container.querySelectorAll('.health-info-grid');
        let maxItemCount = 0;
        
        // Find the section with the most items to determine optimal column count
        grids.forEach(grid => {
            maxItemCount = Math.max(maxItemCount, grid.children.length);
        });
        
        // Calculate optimal columns based on the section with most items
        // but don't exceed maxPossibleColumns
        const optimalColumns = Math.min(maxPossibleColumns, maxItemCount);
        
        // Calculate the actual card width to use
        const cardWidth = Math.floor((containerWidth - (gap * (optimalColumns - 1))) / optimalColumns);
        
        // Apply the same grid layout to all sections
        grids.forEach(grid => {
            grid.style.setProperty('--optimal-columns', optimalColumns);
            grid.style.setProperty('--min-card-width', cardWidth + 'px');
            grid.style.setProperty('--max-card-width', cardWidth + 'px');
        });
    }
}
