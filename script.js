// Preload client logos and fade in carousel
(function() {
    'use strict';
    
    function preloadClientLogos() {
        const clientImages = document.querySelectorAll('.clients-scroll .client-logo-img');
        const clientsScroll = document.querySelector('.clients-scroll');
        const clientsLoader = document.querySelector('.clients-loader');
        
        if (!clientImages.length || !clientsScroll || !clientsLoader) {
            return;
        }
        
        let loadedCount = 0;
        const totalImages = clientImages.length;
        
        function imageLoaded() {
            loadedCount++;
            if (loadedCount === totalImages) {
                // All images loaded, fade in carousel
                setTimeout(function() {
                    clientsScroll.classList.add('loaded');
                    clientsLoader.classList.add('hidden');
                }, 100);
            }
        }
        
        // Preload all images
        clientImages.forEach(function(img) {
            if (img.complete) {
                imageLoaded();
            } else {
                img.addEventListener('load', imageLoaded);
                img.addEventListener('error', imageLoaded); // Count errors too to prevent hanging
            }
        });
        
        // Fallback timeout in case some images don't load
        setTimeout(function() {
            if (loadedCount < totalImages) {
                clientsScroll.classList.add('loaded');
                clientsLoader.classList.add('hidden');
            }
        }, 5000);
    }
    
    // Start preloading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', preloadClientLogos);
    } else {
        preloadClientLogos();
    }
})();

// Carousel drag functionality with seamless infinite loop
(function() {
    'use strict';
    
    let carouselInitialized = false;
    
    function initCarousel() {
        // Prevent multiple initializations
        if (carouselInitialized) return;
        
        const carousel = document.querySelector('.clients-scroll');
        const wrapper = document.querySelector('.clients-scroll-wrapper');
        
        if (!carousel || !wrapper) {
            // Retry if elements aren't ready yet
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initCarousel);
            } else {
                setTimeout(initCarousel, 200);
            }
            return;
        }
        
        carouselInitialized = true;
        
        let isDown = false;
        let startX;
        let scrollLeft;
        let animationPaused = false;
        let firstSetWidth = 0;
        let autoScrollInterval = null;
        const scrollSpeed = 0.5;
        
        // Remove CSS animation
        carousel.style.animation = 'none';
        
        // Auto-scroll function
        function startAutoScroll() {
            // Clear any existing interval first
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
            
            // Calculate width - use offsetWidth for more reliable measurement
            if (firstSetWidth === 0) {
                const totalWidth = carousel.scrollWidth || carousel.offsetWidth * 2;
                firstSetWidth = totalWidth > 0 ? totalWidth / 2 : 0;
            }
            
            // Check if carousel is actually scrollable
            const wrapperWidth = wrapper.clientWidth || wrapper.offsetWidth;
            const carouselWidth = carousel.scrollWidth || carousel.offsetWidth;
            
            // Only start if we have a valid width and carousel is wider than wrapper
            if (firstSetWidth === 0 || firstSetWidth < 100 || carouselWidth <= wrapperWidth) {
                // Retry after a short delay
                setTimeout(function() {
                    const retryWidth = carousel.scrollWidth || carousel.offsetWidth * 2;
                    firstSetWidth = retryWidth / 2;
                    const retryCarouselWidth = carousel.scrollWidth || carousel.offsetWidth;
                    const retryWrapperWidth = wrapper.clientWidth || wrapper.offsetWidth;
                    
                    if (firstSetWidth > 0 && retryCarouselWidth > retryWrapperWidth) {
                        startAutoScroll();
                    }
                }, 200);
                return;
            }
            
            // Start the interval
            autoScrollInterval = setInterval(function() {
                if (!isDown && !animationPaused && firstSetWidth > 0) {
                    wrapper.scrollLeft += scrollSpeed;
                    
                    // When we reach the end of the first set, seamlessly jump to start
                    if (wrapper.scrollLeft >= firstSetWidth) {
                        wrapper.scrollLeft = wrapper.scrollLeft - firstSetWidth;
                    }
                }
            }, 16); // ~60fps
        }
        
        function stopAutoScroll() {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
        }
        
        // Handle seamless loop when user scrolls manually
        function handleSeamlessLoop() {
            if (firstSetWidth === 0) return;
            
            const currentScroll = wrapper.scrollLeft;
            
            if (currentScroll >= firstSetWidth) {
                wrapper.scrollLeft = currentScroll - firstSetWidth;
            } else if (currentScroll < 0) {
                wrapper.scrollLeft = currentScroll + firstSetWidth;
            }
        }
        
        // Mouse events on wrapper
        wrapper.addEventListener('mousedown', function(e) {
            isDown = true;
            wrapper.style.cursor = 'grabbing';
            startX = e.pageX - wrapper.offsetLeft;
            scrollLeft = wrapper.scrollLeft;
            animationPaused = true;
            stopAutoScroll();
            e.preventDefault();
        });
        
        wrapper.addEventListener('mouseleave', function() {
            if (isDown) {
                isDown = false;
                wrapper.style.cursor = 'grab';
                handleSeamlessLoop();
                animationPaused = false;
                startAutoScroll();
            }
        });
        
        wrapper.addEventListener('mouseup', function() {
            if (isDown) {
                isDown = false;
                wrapper.style.cursor = 'grab';
                handleSeamlessLoop();
                animationPaused = false;
                startAutoScroll();
            }
        });
        
        wrapper.addEventListener('mousemove', function(e) {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - wrapper.offsetLeft;
            const walk = (x - startX) * 2;
            wrapper.scrollLeft = scrollLeft - walk;
            handleSeamlessLoop();
        });
        
        // Touch events for mobile
        let touchStartX = 0;
        let touchScrollLeft = 0;
        
        wrapper.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].pageX - wrapper.offsetLeft;
            touchScrollLeft = wrapper.scrollLeft;
            animationPaused = true;
            stopAutoScroll();
        }, { passive: false });
        
        wrapper.addEventListener('touchmove', function(e) {
            if (!touchStartX) return;
            e.preventDefault();
            const x = e.touches[0].pageX - wrapper.offsetLeft;
            const walk = (x - touchStartX) * 2;
            wrapper.scrollLeft = touchScrollLeft - walk;
            handleSeamlessLoop();
        }, { passive: false });
        
        wrapper.addEventListener('touchend', function() {
            if (touchStartX) {
                touchStartX = 0;
                handleSeamlessLoop();
                animationPaused = false;
                startAutoScroll();
            }
        });
        
        // Handle seamless loop on scroll events
        wrapper.addEventListener('scroll', function() {
            if (!isDown) {
                handleSeamlessLoop();
            }
        });
        
        // Set initial cursor
        wrapper.style.cursor = 'grab';
        wrapper.style.userSelect = 'none';
        
        // Initialize carousel - wait for images to load and fade-in to complete
        function initializeCarousel() {
            // Check if carousel is visible (has 'loaded' class)
            const isCarouselLoaded = carousel.classList.contains('loaded');
            
            // Wait for images to load before calculating width
            const images = carousel.querySelectorAll('img');
            const totalImages = images.length;
            
            // Function to calculate and start
            function calculateAndStart() {
                // Wait a bit for fade-in transition to complete if carousel just loaded
                if (isCarouselLoaded) {
                    setTimeout(function() {
                        doCalculateAndStart();
                    }, 700); // Wait for 0.6s fade + 0.1s buffer
                } else {
                    // If not loaded yet, wait for it
                    const checkLoaded = setInterval(function() {
                        if (carousel.classList.contains('loaded')) {
                            clearInterval(checkLoaded);
                            setTimeout(function() {
                                doCalculateAndStart();
                            }, 700);
                        }
                    }, 100);
                    
                    // Fallback: start anyway after 3 seconds
                    setTimeout(function() {
                        clearInterval(checkLoaded);
                        doCalculateAndStart();
                    }, 3000);
                }
            }
            
            function doCalculateAndStart() {
                // Force a reflow to ensure accurate measurements
                void carousel.offsetWidth;
                void wrapper.offsetWidth;
                
                // Calculate the exact width of the first set
                const totalWidth = carousel.scrollWidth;
                
                if (totalWidth > 0) {
                    firstSetWidth = totalWidth / 2;
                    const wrapperWidth = wrapper.clientWidth;
                    
                    // Ensure we have a valid width and carousel is scrollable
                    if (firstSetWidth > wrapperWidth && firstSetWidth > 100) {
                        // Set initial scroll position to start of first set
                        wrapper.scrollLeft = 0;
                        
                        // Start auto-scroll
                        startAutoScroll();
                    } else {
                        // Retry after a delay
                        setTimeout(initializeCarousel, 300);
                    }
                } else {
                    // Retry after a delay
                    setTimeout(initializeCarousel, 300);
                }
            }
            
            // Wait for images to load before starting
            if (totalImages === 0) {
                // No images, calculate immediately
                calculateAndStart();
            } else {
                let allLoaded = false;
                let imagesLoadedCount = 0;
                
                // Count already loaded images
                images.forEach(function(img) {
                    if (img.complete && img.naturalWidth > 0) {
                        imagesLoadedCount++;
                    }
                });
                
                // If all images are already loaded, start immediately
                if (imagesLoadedCount >= totalImages) {
                    calculateAndStart();
                } else {
                    // Wait for all images to load before starting
                    images.forEach(function(img) {
                        if (!img.complete || img.naturalWidth === 0) {
                            const loadHandler = function() {
                                imagesLoadedCount++;
                                if (imagesLoadedCount >= totalImages && !allLoaded) {
                                    allLoaded = true;
                                    calculateAndStart();
                                }
                            };
                            const errorHandler = function() {
                                imagesLoadedCount++;
                                if (imagesLoadedCount >= totalImages && !allLoaded) {
                                    allLoaded = true;
                                    calculateAndStart();
                                }
                            };
                            img.addEventListener('load', loadHandler, { once: true });
                            img.addEventListener('error', errorHandler, { once: true });
                        }
                    });
                    
                    // Fallback: if images take too long, start anyway after 3 seconds
                    setTimeout(function() {
                        if (!allLoaded) {
                            calculateAndStart();
                        }
                    }, 3000);
                }
            }
        }
        
        // Add visibility change handler to restart auto-scroll when page becomes visible
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && firstSetWidth > 0 && !animationPaused) {
                setTimeout(startAutoScroll, 200);
            } else if (document.hidden) {
                stopAutoScroll();
            }
        });
        
        // Start initialization
        initializeCarousel();
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarousel);
    } else {
        initCarousel();
    }
})();

// Reload page to top functionality
document.addEventListener('DOMContentLoaded', function() {
    // JTE Logo - reload page to top
    const logoLink = document.querySelector('.logo[href="index.html"]');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
                window.location.reload();
            } else {
                window.location.href = 'index.html';
            }
        });
    }
    
    // BACK TO TOP button - smooth scroll to top
    const backToTopButton = document.querySelector('.contact-cta-secondary[href="index.html"]');
    if (backToTopButton) {
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Smooth scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Formspree form submission handling
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('form-status');
    
    if (contactForm) {
        // Find or create form status element
        let statusElement = formStatus;
        if (!statusElement) {
            // Try to find it by class or create it
            statusElement = contactForm.querySelector('#form-status') || 
                          contactForm.querySelector('.form-status');
            if (!statusElement) {
                // Create status element if it doesn't exist
                statusElement = document.createElement('div');
                statusElement.id = 'form-status';
                statusElement.style.display = 'none';
                statusElement.style.padding = '1rem';
                statusElement.style.marginBottom = '1rem';
                statusElement.style.borderRadius = '4px';
                statusElement.style.textAlign = 'center';
                contactForm.insertBefore(statusElement, contactForm.firstChild);
            }
        }
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Disable submit button
            const submitButton = contactForm.querySelector('button[type="submit"]');
            if (!submitButton) {
                console.error('Submit button not found');
                return;
            }
            
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'SENDING...';
            
            // Hide any previous status messages
            if (statusElement) {
                statusElement.style.display = 'none';
            }
            
            // Get form data
            const formData = new FormData(contactForm);
            
            // Submit to Formspree
            fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    // Success
                    if (statusElement) {
                        statusElement.style.display = 'block';
                        statusElement.style.backgroundColor = '#d4edda';
                        statusElement.style.color = '#155724';
                        statusElement.style.border = '1px solid #c3e6cb';
                        statusElement.textContent = 'Thank you! Your message has been sent successfully. We will get back to you soon.';
                    }
                    contactForm.reset();
                } else {
                    // Error from Formspree
                    return response.json().then(data => {
                        throw new Error(data.error || 'Form submission failed');
                    });
                }
            })
            .catch(error => {
                // Network or other error
                if (statusElement) {
                    statusElement.style.display = 'block';
                    statusElement.style.backgroundColor = '#f8d7da';
                    statusElement.style.color = '#721c24';
                    statusElement.style.border = '1px solid #f5c6cb';
                    statusElement.textContent = 'Sorry, there was an error sending your message. Please try again or contact us directly at sales@jteevents.com.au';
                }
                console.error('Form submission error:', error);
            })
            .finally(() => {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                
                // Scroll to status message
                if (statusElement) {
                    statusElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
    }
    
    // Active section indicator
    function initActiveSectionIndicator() {
        const sections = [
            { id: 'home', link: document.querySelector('a[href="#home"]') },
            { id: 'services', link: document.querySelector('a[href="#services"]') },
            { id: 'clients', link: document.querySelector('a[href="#clients"]') }
        ];
        
        const navLinks = sections.map(s => s.link).filter(Boolean);
        
        if (navLinks.length === 0) return;
        
        function updateActiveSection() {
            const viewportHeight = window.innerHeight;
            const scrollY = window.scrollY;
            const headerOffset = 120; // Account for header
            const viewportTop = scrollY + headerOffset;
            const viewportBottom = scrollY + viewportHeight;
            
            let activeSection = null;
            let bestScore = -1;
            
            sections.forEach(section => {
                const element = document.getElementById(section.id);
                if (!element) return;
                
                const rect = element.getBoundingClientRect();
                const elementTop = rect.top + scrollY;
                const elementBottom = elementTop + rect.height;
                const elementHeight = rect.height;
                
                // Calculate visible portion of section
                const visibleTop = Math.max(viewportTop, elementTop);
                const visibleBottom = Math.min(viewportBottom, elementBottom);
                const visibleHeight = Math.max(0, visibleBottom - visibleTop);
                
                // Section must have meaningful visibility (at least 40% of viewport or 40% of section)
                const viewportVisibility = visibleHeight / viewportHeight;
                const sectionVisibility = visibleHeight / elementHeight;
                const minVisibility = Math.min(viewportVisibility, sectionVisibility);
                
                if (minVisibility >= 0.4) {
                    // Score based on: how close section top is to viewport top, and visibility
                    const distanceFromTop = Math.abs(viewportTop - elementTop);
                    const normalizedDistance = Math.min(distanceFromTop / viewportHeight, 1);
                    const score = (1 - normalizedDistance) * 60 + minVisibility * 40;
                    
                    if (score > bestScore) {
                        bestScore = score;
                        activeSection = section;
                    }
                }
            });
            
            // Fallback: if no section meets visibility threshold, find closest to viewport top
            if (!activeSection) {
                let minDistance = Infinity;
                sections.forEach(section => {
                    const element = document.getElementById(section.id);
                    if (!element) return;
                    
                    const rect = element.getBoundingClientRect();
                    const elementTop = rect.top + scrollY;
                    const distance = Math.abs(viewportTop - elementTop);
                    
                    // Only consider if section is above or just below viewport top
                    if (elementTop <= viewportBottom && distance < minDistance) {
                        minDistance = distance;
                        activeSection = section;
                    }
                });
            }
            
            // Update active state
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            if (activeSection && activeSection.link) {
                activeSection.link.classList.add('active');
            }
        }
        
        // Flag to prevent scroll handler from interfering with click updates
        let isClickNavigation = false;
        let clickNavigationTimeout = null;
        
        // Update on scroll
        let ticking = false;
        window.addEventListener('scroll', function() {
            // Don't update if we just clicked a nav link
            if (isClickNavigation) return;
            
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateActiveSection();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Initial update
        updateActiveSection();
        
        // Update when clicking nav links (smooth transition)
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    const clickedSection = sections.find(s => s.id === sectionId);
                    
                    // Set flag to prevent scroll handler interference
                    isClickNavigation = true;
                    
                    // Clear any existing timeout
                    if (clickNavigationTimeout) {
                        clearTimeout(clickNavigationTimeout);
                    }
                    
                    // Smoothly update active state
                    navLinks.forEach(l => {
                        if (l !== clickedSection.link) {
                            l.classList.remove('active');
                        }
                    });
                    
                    // Use requestAnimationFrame for smooth transition
                    requestAnimationFrame(function() {
                        if (clickedSection && clickedSection.link) {
                            clickedSection.link.classList.add('active');
                        }
                    });
                    
                    // Re-enable scroll handler after transition completes
                    clickNavigationTimeout = setTimeout(function() {
                        isClickNavigation = false;
                        // Final update to ensure correct state
                        updateActiveSection();
                    }, 300);
                }
            });
        });
        
        // Handle hash in URL on page load
        if (window.location.hash) {
            const hash = window.location.hash.substring(1);
            const section = sections.find(s => s.id === hash);
            if (section && section.link) {
                setTimeout(function() {
                    section.link.classList.add('active');
                    navLinks.forEach(link => {
                        if (link !== section.link) {
                            link.classList.remove('active');
                        }
                    });
                }, 100);
            }
        }
    }
    
    // Initialize active section indicator
    initActiveSectionIndicator();
});
