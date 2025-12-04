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
                    // Use requestAnimationFrame for smoother scrolling
                    wrapper.scrollLeft += scrollSpeed;
                    
                    // When we reach the end of the first set, seamlessly jump to start
                    if (wrapper.scrollLeft >= firstSetWidth - 10) {
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
        
        // Initialize carousel
        function initialize() {
            // Calculate width
            firstSetWidth = carousel.scrollWidth / 2;
            
            // Set initial scroll position
            if (wrapper.scrollLeft === 0) {
                wrapper.scrollLeft = 0;
            }
            
            // Start auto-scroll
            startAutoScroll();
        }
        
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
