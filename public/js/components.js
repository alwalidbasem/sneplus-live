// Component loader: injects shared partials from /components/*.html
// Usage: place <div data-component="navbar"></div> / <div data-component="footer"></div>
// in the page, load this script before app.js. App.init() calls Components.mount() for you.
const Components = {
    cache: {},

    async load(name) {
        if (!Components.cache[name]) {
            const res = await fetch('/components/' + name + '.html', { cache: 'no-store' });
            if (!res.ok) throw new Error('Component not found: ' + name);
            Components.cache[name] = await res.text();
        }
        return Components.cache[name];
    },

    // Replaces every [data-component] placeholder in DOM order.
    async mount(root = document) {
        const slots = Array.from(root.querySelectorAll('[data-component]'));
        for (const slot of slots) {
            const name = slot.getAttribute('data-component');
            slot.outerHTML = await Components.load(name);
        }
    }
};