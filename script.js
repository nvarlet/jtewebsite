// Carousel drag functionality with seamless infinite loop
(function() {
    'use strict';
    
    function initCarousel() {
        const carousel = document.querySelector('.clients-scroll');
        const wrapper = document.querySelector('.clients-scroll-wrapper');
        
        if (!carousel || !wrapper) {
            // Retry if elements aren't ready yet
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initCarousel);
            } else {
                setTimeout(initCarousel, 100);
            }
            return;
        }
        
        let isDown = false;
        let startX;
        let scrollLeft;
        let animationPaused = false;
        let firstSetWidth = 0;
        let autoScrollAnimationFrame = null;
        const scrollSpeed = 0.5;
        
        // Remove CSS animation
        carousel.style.animation = 'none';
        
        // Auto-scroll function using requestAnimationFrame for seamless scrolling
        function startAutoScroll() {
            // Clear any existing animation frame first
            if (autoScrollAnimationFrame) {
                cancelAnimationFrame(autoScrollAnimationFrame);
                autoScrollAnimationFrame = null;
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
                // Retry after a delay (longer for mobile)
                setTimeout(function() {
                    const retryWidth = carousel.scrollWidth || carousel.offsetWidth * 2;
                    firstSetWidth = retryWidth / 2;
                    const retryCarouselWidth = carousel.scrollWidth || carousel.offsetWidth;
                    const retryWrapperWidth = wrapper.clientWidth || wrapper.offsetWidth;
                    
                    if (firstSetWidth > 0 && retryCarouselWidth > retryWrapperWidth) {
                        startAutoScroll();
                    } else {
                        // Final retry after images load
                        window.addEventListener('load', function() {
                            setTimeout(startAutoScroll, 500);
                        });
                    }
                }, 500);
                return;
            }
            
            // Use requestAnimationFrame for smooth, seamless scrolling
            function animate() {
                if (!isDown && !animationPaused && firstSetWidth > 0) {
                    wrapper.scrollLeft += scrollSpeed;
                    
                    // Seamlessly reset when we reach the end of the first set
                    // Reset happens in the same frame to avoid visible jump
                    const currentScroll = wrapper.scrollLeft;
                    if (currentScroll >= firstSetWidth) {
                        // Calculate how far past firstSetWidth we've scrolled
                        const overflow = currentScroll - firstSetWidth;
                        // Reset to the equivalent position in the first set
                        // This ensures duplicate content appears in exact same position
                        wrapper.scrollLeft = overflow;
                    }
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
                // Add a small delay before restarting to ensure touch is fully ended
                setTimeout(function() {
                    startAutoScroll();
                }, 100);
            }
        });
        
        // Handle touch cancel (e.g., when user scrolls page instead of carousel)
        wrapper.addEventListener('touchcancel', function() {
            if (touchStartX) {
                touchStartX = 0;
                animationPaused = false;
                setTimeout(function() {
                    startAutoScroll();
                }, 100);
            }
        });
        
        // Handle seamless loop on scroll events (for manual scrolling)
        wrapper.addEventListener('scroll', function() {
            if (!isDown && !animationPaused) {
                handleSeamlessLoop();
            }
        });
        
        // Set initial cursor
        wrapper.style.cursor = 'grab';
        wrapper.style.userSelect = 'none';
        
        // Initialize carousel
        function initialize() {
            // Wait for images to load before calculating width
            const images = carousel.querySelectorAll('img');
            let imagesLoaded = 0;
            const totalImages = images.length;
            
            if (totalImages === 0) {
                // No images, calculate immediately
                firstSetWidth = carousel.scrollWidth / 2;
                startAutoScroll();
                return;
            }
            
            // Wait for all images to load
            images.forEach(function(img) {
                if (img.complete) {
                    imagesLoaded++;
                    checkAllLoaded();
                } else {
                    img.addEventListener('load', function() {
                        imagesLoaded++;
                        checkAllLoaded();
                    });
                    img.addEventListener('error', function() {
                        imagesLoaded++;
                        checkAllLoaded();
                    });
                }
            });
            
            function checkAllLoaded() {
                if (imagesLoaded >= totalImages) {
                    // All images loaded, calculate width with more precision
                    setTimeout(function() {
                        // Force a reflow to ensure accurate measurements
                        void carousel.offsetWidth;
                        // Calculate the exact width of the first set
                        // Use scrollWidth which includes all content
                        const totalWidth = carousel.scrollWidth;
                        firstSetWidth = totalWidth / 2;
                        
                        // Ensure we have a valid width
                        if (firstSetWidth > 0) {
                            // Set initial scroll position to start of first set
                            wrapper.scrollLeft = 0;
                            startAutoScroll();
                        }
                    }, 150);
                }
            }
        }
        
        // Add visibility change handler to restart auto-scroll when page becomes visible
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && !isDown && !animationPaused && firstSetWidth > 0) {
                setTimeout(startAutoScroll, 100);
            }
        });
        
        // Try multiple initialization methods
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // Wait a bit for layout to settle
            setTimeout(initialize, 100);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(initialize, 100);
            });
        }
        
        // Also try after window load
        window.addEventListener('load', function() {
            setTimeout(initialize, 300);
        });
        
        // Final fallback
        setTimeout(initialize, 500);
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
    
    // BACK TO TOP button - reload page to top
    const backToTopButton = document.querySelector('.contact-cta-secondary[href="index.html"]');
    if (backToTopButton) {
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
                window.location.reload();
            } else {
                window.location.href = 'index.html';
            }
        });
    }
});
