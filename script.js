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
        let isInteracting = false;
        let firstSetWidth = 0;
        let autoScrollAnimationFrame = null;
        let isUserScrolling = false;
        let userScrollTimeout = null;
        const scrollSpeed = 0.8;
        let isInitialized = false;
        let initializationAttempts = 0;
        const maxInitAttempts = 10;
        
        // Remove CSS animation
        carousel.style.animation = 'none';
        
        // Auto-scroll function using requestAnimationFrame for seamless scrolling
        function startAutoScroll() {
            // Don't start if user is interacting
            if (isInteracting || isUserScrolling) return;
            
            // Clear any existing animation frame first
            if (autoScrollAnimationFrame) {
                cancelAnimationFrame(autoScrollAnimationFrame);
                autoScrollAnimationFrame = null;
            }
            
            // Recalculate width if needed
            if (firstSetWidth === 0) {
                const totalWidth = carousel.scrollWidth;
                if (totalWidth > 0) {
                    firstSetWidth = totalWidth / 2;
                } else {
                    // Retry initialization
                    if (!isInitialized) {
                        setTimeout(initializeCarousel, 200);
                    }
                    return;
                }
            }
            
            // Check if carousel is actually scrollable
            const wrapperWidth = wrapper.clientWidth;
            const carouselWidth = carousel.scrollWidth;
            
            // Only start if we have a valid width and carousel is wider than wrapper
            if (firstSetWidth === 0 || firstSetWidth < 100 || carouselWidth <= wrapperWidth) {
                // Retry initialization
                if (!isInitialized) {
                    setTimeout(initializeCarousel, 300);
                }
                return;
            }
            
            // Use requestAnimationFrame for smooth, seamless scrolling
            function animate() {
                // Check if we should continue animating
                if (isInteracting || firstSetWidth === 0 || isUserScrolling) {
                    autoScrollAnimationFrame = null;
                    return;
                }
                
                wrapper.scrollLeft += scrollSpeed;
                
                // Seamlessly reset when we reach the end of the first set
                const currentScroll = wrapper.scrollLeft;
                if (currentScroll >= firstSetWidth) {
                    const overflow = currentScroll - firstSetWidth;
                    wrapper.scrollLeft = overflow;
                }
                
                autoScrollAnimationFrame = requestAnimationFrame(animate);
            }
            
            autoScrollAnimationFrame = requestAnimationFrame(animate);
        }
        
        function stopAutoScroll() {
            if (autoScrollAnimationFrame) {
                cancelAnimationFrame(autoScrollAnimationFrame);
                autoScrollAnimationFrame = null;
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
        
        // Restart auto-scroll after interaction ends
        function restartAutoScroll() {
            isInteracting = false;
            handleSeamlessLoop();
            
            // Clear any existing timeout
            if (userScrollTimeout) {
                clearTimeout(userScrollTimeout);
            }
            
            // Mark that user scrolling has ended after a short delay
            isUserScrolling = true;
            userScrollTimeout = setTimeout(function() {
                isUserScrolling = false;
                // Restart auto-scroll
                if (firstSetWidth > 0) {
                    startAutoScroll();
                }
            }, 300);
        }
        
        // Mouse events on wrapper
        wrapper.addEventListener('mousedown', function(e) {
            isDown = true;
            isInteracting = true;
            isUserScrolling = true;
            wrapper.style.cursor = 'grabbing';
            startX = e.pageX - wrapper.offsetLeft;
            scrollLeft = wrapper.scrollLeft;
            stopAutoScroll();
            e.preventDefault();
        });
        
        wrapper.addEventListener('mouseleave', function() {
            if (isDown) {
                isDown = false;
                wrapper.style.cursor = 'grab';
                restartAutoScroll();
            }
        });
        
        wrapper.addEventListener('mouseup', function() {
            if (isDown) {
                isDown = false;
                wrapper.style.cursor = 'grab';
                restartAutoScroll();
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
        let touchMoved = false;
        
        wrapper.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].pageX - wrapper.offsetLeft;
            touchScrollLeft = wrapper.scrollLeft;
            touchMoved = false;
            isInteracting = true;
            isUserScrolling = true;
            stopAutoScroll();
        }, { passive: true });
        
        wrapper.addEventListener('touchmove', function(e) {
            if (!touchStartX) return;
            touchMoved = true;
            const x = e.touches[0].pageX - wrapper.offsetLeft;
            const walk = (x - touchStartX) * 2;
            wrapper.scrollLeft = touchScrollLeft - walk;
            handleSeamlessLoop();
        }, { passive: true });
        
        wrapper.addEventListener('touchend', function() {
            if (touchStartX) {
                touchStartX = 0;
                // Small delay to ensure touch is fully ended
                setTimeout(function() {
                    restartAutoScroll();
                }, 50);
            }
        }, { passive: true });
        
        // Handle touch cancel (e.g., when user scrolls page instead of carousel)
        wrapper.addEventListener('touchcancel', function() {
            if (touchStartX) {
                touchStartX = 0;
                setTimeout(function() {
                    restartAutoScroll();
                }, 50);
            }
        }, { passive: true });
        
        // Handle seamless loop on scroll events (for manual scrolling)
        wrapper.addEventListener('scroll', function() {
            // Only handle loop if user is manually scrolling
            if (isInteracting || isUserScrolling) {
                handleSeamlessLoop();
            }
        }, { passive: true });
        
        // Set initial cursor
        wrapper.style.cursor = 'grab';
        wrapper.style.userSelect = 'none';
        
        // Initialize carousel with robust retry logic
        function initializeCarousel() {
            initializationAttempts++;
            
            if (initializationAttempts > maxInitAttempts) {
                console.warn('Carousel initialization failed after multiple attempts');
                return;
            }
            
            // Wait for images to load before calculating width
            const images = carousel.querySelectorAll('img');
            let imagesLoaded = 0;
            const totalImages = images.length;
            
            // Function to calculate and start
            function calculateAndStart() {
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
                        isInitialized = true;
                        isUserScrolling = false; // Ensure this is false on init
                        isInteracting = false; // Ensure this is false on init
                        
                        // Fade in the carousel smoothly
                        wrapper.style.opacity = '0';
                        wrapper.style.transition = 'opacity 0.5s ease-in';
                        
                        // Start auto-scroll immediately - no delay
                        startAutoScroll();
                        
                        // Fade in after a brief moment
                        setTimeout(function() {
                            wrapper.style.opacity = '1';
                        }, 50);
                    } else {
                        // Retry after a delay
                        if (initializationAttempts < maxInitAttempts) {
                            setTimeout(initializeCarousel, 500);
                        }
                    }
                } else {
                    // Retry after a delay
                    if (initializationAttempts < maxInitAttempts) {
                        setTimeout(initializeCarousel, 500);
                    }
                }
            }
            
            // Wait for images to load before starting to prevent reset
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
                                    // All images loaded, now start smoothly
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
                    
                    // Fallback: if images take too long, start anyway after 2 seconds
                    setTimeout(function() {
                        if (!allLoaded && !isInitialized) {
                            calculateAndStart();
                        }
                    }, 2000);
                }
            }
        }
        
        // Add visibility change handler to restart auto-scroll when page becomes visible
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && !isInteracting && firstSetWidth > 0) {
                setTimeout(startAutoScroll, 200);
            } else if (document.hidden) {
                stopAutoScroll();
            }
        });
        
        // Add periodic check to ensure auto-scroll is running (safety net)
        setInterval(function() {
            if (!isInteracting && !isUserScrolling && firstSetWidth > 0 && !autoScrollAnimationFrame && !document.hidden) {
                startAutoScroll();
            }
        }, 1000);
        
        // Start initialization immediately
        function startInit() {
            initializeCarousel();
        }
        
        // Start initialization immediately - multiple attempts to ensure it starts
        // Try immediately
        startInit();
        
        // Also try on DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startInit);
        }
        
        // Also try after window load
        window.addEventListener('load', function() {
            if (!isInitialized) {
                startInit();
            }
        });
        
        // Multiple fallbacks to ensure it starts
        setTimeout(startInit, 100);
        setTimeout(startInit, 500);
        setTimeout(function() {
            if (!isInitialized) {
                startInit();
            }
        }, 1000);
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
    
    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Disable submit button
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'SENDING...';
            
            // Hide any previous status messages
            formStatus.style.display = 'none';
            
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
                    formStatus.style.display = 'block';
                    formStatus.style.backgroundColor = '#d4edda';
                    formStatus.style.color = '#155724';
                    formStatus.style.border = '1px solid #c3e6cb';
                    formStatus.textContent = 'Thank you! Your message has been sent successfully. We will get back to you soon.';
                    contactForm.reset();
                } else {
                    // Error from Formspree
                    throw new Error('Form submission failed');
                }
            })
            .catch(error => {
                // Network or other error
                formStatus.style.display = 'block';
                formStatus.style.backgroundColor = '#f8d7da';
                formStatus.style.color = '#721c24';
                formStatus.style.border = '1px solid #f5c6cb';
                formStatus.textContent = 'Sorry, there was an error sending your message. Please try again or contact us directly at sales@jteevents.com.au';
            })
            .finally(() => {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                
                // Scroll to status message
                formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        });
    }
});
