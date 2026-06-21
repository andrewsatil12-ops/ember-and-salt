// Preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const heroVideo = document.querySelector('.hero-bg-video');
if (heroVideo) {
    if (prefersReducedMotion) {
        heroVideo.pause();
        heroVideo.removeAttribute('autoplay');
    } else {
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    heroVideo.play();
                } else {
                    heroVideo.pause();
                }
            });
        }, { threshold: 0 });
        heroObserver.observe(heroVideo);
    }
}

// Lenis Smooth Scroll
let lenis;
if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    // Sincroniza o Lenis com o ScrollTrigger — sem isso, os dois calculam
    // posição de scroll separadamente e o resultado é engasgo no scroll.
    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
    }

    // Lenis passa a ser "tocado" pelo ticker do GSAP em vez de ter seu
    // próprio loop de requestAnimationFrame separado — um relógio só pros dois.
    if (typeof gsap !== 'undefined') {
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    } else {
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }
}

// GSAP Animations
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Animate dish cards on scroll (if on index.html)
    const cards = gsap.utils.toArray('.dish-card');
    if (cards.length > 0) {
        ScrollTrigger.batch(cards, {
            start: "top 85%",
            once: true,
            onEnter: (batch) => {
                gsap.fromTo(batch,
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1 }
                );
            }
        });
    }
}

// Ember Sparks — toca uma única vez quando #menu entra na tela, cobrindo a tela inteira
const menuSection = document.getElementById('menu');
if (menuSection && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    ScrollTrigger.create({
        trigger: menuSection,
        start: "top 70%",
        once: true,
        onEnter: () => {
            const sparkContainer = document.createElement('div');
            sparkContainer.className = 'spark-container';
            document.body.appendChild(sparkContainer);

            const sparkCount = 30;
            for (let i = 0; i < sparkCount; i++) {
                const spark = document.createElement('div');
                spark.className = 'spark';
                spark.style.left = `${Math.random() * 100}%`;
                spark.style.bottom = `${Math.random() * 20}%`;
                spark.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`);
                spark.style.animationDelay = `${Math.random() * 1}s`;
                spark.style.animationDuration = `${1.8 + Math.random() * 1}s`;
                sparkContainer.appendChild(spark);
            }

            // Remove o efeito inteiro depois de 3s, limpa o DOM
            setTimeout(() => {
                sparkContainer.remove();
            }, 3000);
        }
    });
}

// Data for Modal
const dishData = {
    "1": {
        desc: "Grilled straight over charcoal, skin blistered, center soft. Burnt lemon, charred herb oil.",
        allergens: "Allergens: shellfish"
    },
    "2": {
        desc: "Whole head, hours over slow coals until the core gives. Charred crust outside, steam within.",
        allergens: "Allergens: none"
    },
    "3": {
        desc: "36-hour natural fermentation, wood oven. Butter smoked over charcoal, finished with sea salt.",
        allergens: "Allergens: gluten, dairy"
    },
    "4": {
        desc: "Smoked low over wood embers for 18 hours. Falls off the bone, smoke all the way through.",
        allergens: "Allergens: none"
    },
    "5": {
        desc: "Straight off the charcoal grill, smoked chili butter, shell charring at the edges.",
        allergens: "Allergens: shellfish"
    },
    "6": {
        desc: "Direct over the coals, charred herb crust, pink at the center.",
        allergens: "Allergens: none"
    },
    "7": {
        desc: "Whole peach over the coals until it caramelizes. Honey smoked over charcoal, sea salt.",
        allergens: "Allergens: none"
    }
};

// Modal Logic
let savedScrollY = 0;
const modal = document.getElementById('dish-modal');
const modalClose = document.getElementById('modal-close');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');
const modalAllergens = document.getElementById('modal-allergens');

document.querySelectorAll('.dish-card').forEach(card => {
    card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const img = card.querySelector('.dish-img').src;
        const name = card.querySelector('.dish-name').innerText;
        const price = card.querySelector('.dish-price').innerText;
        
        modalImg.src = img;
        modalImg.alt = name;
        modalTitle.innerText = name;
        modalPrice.innerText = price;
        
        if (dishData[id]) {
            modalDesc.innerText = dishData[id].desc;
            modalAllergens.innerText = dishData[id].allergens;
        } else {
            modalDesc.innerText = "";
            modalAllergens.innerText = "";
        }
        
        savedScrollY = window.scrollY;
        document.body.style.top = `-${savedScrollY}px`;
        document.body.classList.add('modal-open');
        modal.classList.add('active');
        if (lenis) lenis.stop(); // Prevent scrolling while modal is open
    });
});

modalClose?.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
    if (lenis) lenis.start();
});

modal?.addEventListener('click', (e) => {
    if(e.target === modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, savedScrollY);
        if (lenis) lenis.start();
    }
});

// Search Input (defined early for filter access)
const searchInput = document.getElementById('table-search');

// Filter Logic
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Clear search input if present
        if (searchInput && searchInput.value !== '') {
            searchInput.value = '';
        }

        const filterVal = btn.getAttribute('data-filter');

        // Apply filter using is-hidden class
        document.querySelectorAll('.dish-card').forEach(card => {
            const shouldShow = filterVal === 'all' || (card.hasAttribute(filterVal) && card.getAttribute(filterVal) === "true");
            card.classList.toggle('is-hidden', !shouldShow);
        });
        
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    });
});

// Search Logic for Table Mode (mesa.html)
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        // Reset filters when searching
        filterBtns.forEach(b => b.classList.remove('active'));
        const allBtn = document.querySelector('[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');

        // Apply search filter using is-hidden class
        document.querySelectorAll('.dish-card').forEach(card => {
            const name = card.querySelector('.dish-name').innerText.toLowerCase();
            const shouldShow = name.includes(term);
            card.classList.toggle('is-hidden', !shouldShow);
        });
        
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    });
}
