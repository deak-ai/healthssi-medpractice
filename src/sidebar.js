import { Collapse } from 'flowbite';

// Initialize dropdowns
document.addEventListener('DOMContentLoaded', () => {
    // Get all dropdown buttons
    const dropdownButtons = document.querySelectorAll('[data-collapse-toggle]');
    
    dropdownButtons.forEach(button => {
        const targetId = button.getAttribute('data-collapse-toggle');
        const target = document.getElementById(targetId);
        
        if (target) {
            const collapse = new Collapse(target, {
                onCollapse: () => {
                    const arrow = button.querySelector('svg[sidebar-toggle-item]');
                    if (arrow) {
                        arrow.classList.remove('rotate-180');
                    }
                },
                onExpand: () => {
                    const arrow = button.querySelector('svg[sidebar-toggle-item]');
                    if (arrow) {
                        arrow.classList.add('rotate-180');
                    }
                },
                onToggle: () => {
                    // Keep the dropdown open if it has an active item
                    const activeItem = target.querySelector('.bg-gray-100');
                    if (activeItem && !target.classList.contains('hidden')) {
                        target.classList.remove('hidden');
                    }
                }
            });
        }
    });
});
