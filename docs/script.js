// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(element => {
        observer.observe(element);
    });

    // Fetch latest release from GitHub API
    fetchLatestRelease();
});

async function fetchLatestRelease() {
    const versionText = document.getElementById('version-text');
    const downloadBtn = document.getElementById('download-btn');
    
    try {
        const response = await fetch('https://api.github.com/repos/Kobeep/PackPilot/releases/latest');
        
        if (response.ok) {
            const data = await response.json();
            const version = data.tag_name;
            
            // Format date
            const releaseDate = new Date(data.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            versionText.innerHTML = `Latest release: <strong>${version}</strong> (${releaseDate})`;
            
            // Find Windows installer if available
            const msiAsset = data.assets.find(asset => asset.name.endsWith('.msi') || asset.name.endsWith('.exe'));
            if (msiAsset) {
                downloadBtn.href = msiAsset.browser_download_url;
            }
        } else {
            versionText.textContent = 'Check GitHub for the latest release.';
        }
    } catch (error) {
        console.error('Error fetching release:', error);
        versionText.textContent = 'Check GitHub for the latest release.';
    }
}
