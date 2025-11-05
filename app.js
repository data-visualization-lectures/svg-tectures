// SVG Texture Editor - Main Application

class TextureEditor {
    constructor() {
        this.currentTexture = 'lines';
        this.currentFgColor = '#1f2937';
        this.currentBgColor = '#ffffff';
        this.currentSample = 'bar-chart';
        this.textureDensity = 1.0; // heavier/lighter multiplier
        this.textureThickness = 1.0; // thicker/thinner multiplier

        this.initElements();
        this.attachEventListeners();
        this.render();
    }

    initElements() {
        this.elements = {
            textureSelect: document.getElementById('texture-select'),
            fgColor: document.getElementById('fg-color'),
            bgColor: document.getElementById('bg-color'),
            fgColorValue: document.getElementById('fg-color-value'),
            bgColorValue: document.getElementById('bg-color-value'),
            textureDensity: document.getElementById('texture-density'),
            densityValue: document.getElementById('density-value'),
            textureThickness: document.getElementById('texture-thickness'),
            thicknessValue: document.getElementById('thickness-value'),
            svgSelect: document.getElementById('svg-select'),
            applyBtn: document.getElementById('apply-btn'),
            svgContainer: document.getElementById('svg-container'),
            codeDisplay: document.getElementById('code-display'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            copyFeedback: document.getElementById('copy-feedback')
        };
    }

    attachEventListeners() {
        this.elements.textureSelect.addEventListener('change', (e) => {
            this.currentTexture = e.target.value;
        });

        this.elements.fgColor.addEventListener('input', (e) => {
            this.currentFgColor = e.target.value;
            this.elements.fgColorValue.textContent = e.target.value.toUpperCase();
        });

        this.elements.bgColor.addEventListener('input', (e) => {
            this.currentBgColor = e.target.value;
            this.elements.bgColorValue.textContent = e.target.value.toUpperCase();
        });

        this.elements.textureDensity.addEventListener('input', (e) => {
            this.textureDensity = parseFloat(e.target.value);
            this.elements.densityValue.textContent = `(${this.textureDensity.toFixed(1)})`;
        });

        this.elements.textureThickness.addEventListener('input', (e) => {
            this.textureThickness = parseFloat(e.target.value);
            this.elements.thicknessValue.textContent = `(${this.textureThickness.toFixed(1)})`;
        });

        this.elements.svgSelect.addEventListener('change', (e) => {
            this.currentSample = e.target.value;
        });

        this.elements.applyBtn.addEventListener('click', () => {
            this.render();
            this.updateCode();
        });

        this.elements.copyCodeBtn.addEventListener('click', () => {
            this.copyCodeToClipboard();
        });
    }

    createBarChart() {
        const data = [
            { label: 'Q1', value: 65 },
            { label: 'Q2', value: 78 },
            { label: 'Q3', value: 45 },
            { label: 'Q4', value: 88 }
        ];

        const svg = d3.select(this.elements.svgContainer)
            .selectAll('svg')
            .data([null])
            .join('svg')
            .attr('width', 600)
            .attr('height', 400);

        // Clear previous content
        svg.selectAll('*').remove();

        const margin = { top: 20, right: 20, bottom: 30, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        // Add bars
        g.selectAll('.bar')
            .data(data)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.label))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.value))
            .attr('fill', this.currentBgColor)
            .attr('stroke', this.currentFgColor)
            .attr('stroke-width', 2);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .attr('color', this.currentFgColor);

        g.append('g')
            .call(d3.axisLeft(yScale))
            .attr('color', this.currentFgColor);

        this.applyTextureToElements(svg);
    }

    createPieChart() {
        const data = [
            { label: 'A', value: 30 },
            { label: 'B', value: 25 },
            { label: 'C', value: 20 },
            { label: 'D', value: 25 }
        ];

        const svg = d3.select(this.elements.svgContainer)
            .selectAll('svg')
            .data([null])
            .join('svg')
            .attr('width', 500)
            .attr('height', 500);

        // Clear previous content
        svg.selectAll('*').remove();

        const radius = 150;
        const g = svg.append('g')
            .attr('transform', 'translate(250,250)');

        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);

        g.selectAll('.arc')
            .data(pie(data))
            .join('g')
            .attr('class', 'arc')
            .append('path')
            .attr('d', arc)
            .attr('fill', this.currentBgColor)
            .attr('stroke', this.currentFgColor)
            .attr('stroke-width', 2);

        this.applyTextureToElements(svg);
    }

    createNetwork() {
        const nodes = [
            { id: 0, label: 'Node 1' },
            { id: 1, label: 'Node 2' },
            { id: 2, label: 'Node 3' },
            { id: 3, label: 'Node 4' },
            { id: 4, label: 'Node 5' }
        ];

        const links = [
            { source: 0, target: 1 },
            { source: 0, target: 2 },
            { source: 1, target: 3 },
            { source: 2, target: 3 },
            { source: 3, target: 4 }
        ];

        const svg = d3.select(this.elements.svgContainer)
            .selectAll('svg')
            .data([null])
            .join('svg')
            .attr('width', 600)
            .attr('height', 500);

        // Clear previous content
        svg.selectAll('*').remove();

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(300, 250));

        // Add links
        const linkElements = svg.selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', this.currentFgColor)
            .attr('stroke-width', 2);

        // Add nodes
        const nodeElements = svg.selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', 20)
            .attr('fill', this.currentBgColor)
            .attr('stroke', this.currentFgColor)
            .attr('stroke-width', 2);

        simulation.on('tick', () => {
            linkElements
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodeElements
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });

        this.applyTextureToElements(svg);
    }

    createGrid() {
        const svg = d3.select(this.elements.svgContainer)
            .selectAll('svg')
            .data([null])
            .join('svg')
            .attr('width', 600)
            .attr('height', 400);

        // Clear previous content
        svg.selectAll('*').remove();

        const rows = 4;
        const cols = 5;
        const cellWidth = 600 / cols;
        const cellHeight = 400 / rows;

        svg.selectAll('rect.grid-cell')
            .data(d3.range(rows * cols))
            .join('rect')
            .attr('class', 'grid-cell')
            .attr('x', d => (d % cols) * cellWidth)
            .attr('y', d => Math.floor(d / cols) * cellHeight)
            .attr('width', cellWidth)
            .attr('height', cellHeight)
            .attr('fill', this.currentBgColor)
            .attr('stroke', this.currentFgColor)
            .attr('stroke-width', 2);

        this.applyTextureToElements(svg);
    }

    applyTextureToElements(svg) {
        if (this.currentTexture === 'noop') {
            return; // No texture
        }

        // Create texture based on current selection
        let tx;
        try {
            switch (this.currentTexture) {
                // Line-based patterns
                case 'lines':
                    tx = textures.lines()
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(8 * this.textureDensity)
                        .strokeWidth(1.5 * this.textureThickness);
                    break;
                case 'diagonal-stripe':
                    tx = textures.lines()
                        .orientation('diagonal')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(8 * this.textureDensity)
                        .strokeWidth(1.5 * this.textureThickness);
                    break;
                case 'horizontal-stripe':
                    tx = textures.lines()
                        .orientation('horizontal')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(8 * this.textureDensity)
                        .strokeWidth(1.5 * this.textureThickness);
                    break;
                case 'vertical-stripe':
                    tx = textures.lines()
                        .orientation('vertical')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(8 * this.textureDensity)
                        .strokeWidth(1.5 * this.textureThickness);
                    break;

                // Circle-based patterns
                case 'circles':
                    tx = textures.circles()
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(12 * this.textureDensity)
                        .radius(2 * this.textureThickness)
                        .strokeWidth(1 * this.textureThickness);
                    break;
                case 'dots':
                    tx = textures.circles()
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(10 * this.textureDensity)
                        .radius(1.5 * this.textureThickness)
                        .strokeWidth(0.5 * this.textureThickness)
                        .complement();
                    break;

                // Complex patterns using paths
                case 'cross-hatch':
                    tx = textures.paths()
                        .d('crosses')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(8 * this.textureDensity)
                        .strokeWidth(1 * this.textureThickness);
                    break;
                case 'squares':
                    tx = textures.paths()
                        .d('squares')
                        .stroke(this.currentFgColor)
                        .fill(this.currentBgColor)
                        .background(this.currentBgColor)
                        .size(10 * this.textureDensity)
                        .strokeWidth(1 * this.textureThickness);
                    break;
                case 'hexagons':
                    tx = textures.paths()
                        .d('hexagons')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(12 * this.textureDensity)
                        .strokeWidth(1.5 * this.textureThickness);
                    break;
                case 'woven':
                    tx = textures.paths()
                        .d('woven')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(10 * this.textureDensity)
                        .strokeWidth(1 * this.textureThickness);
                    break;
                case 'waves':
                    tx = textures.paths()
                        .d('waves')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(12 * this.textureDensity)
                        .strokeWidth(1.5 * this.textureThickness);
                    break;
                case 'caps':
                    tx = textures.paths()
                        .d('caps')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(10 * this.textureDensity)
                        .strokeWidth(1 * this.textureThickness);
                    break;
                case 'nylon':
                    tx = textures.paths()
                        .d('nylon')
                        .stroke(this.currentFgColor)
                        .background(this.currentBgColor)
                        .size(12 * this.textureDensity)
                        .strokeWidth(1.5 * this.textureThickness);
                    break;
                default:
                    return;
            }

            // Register texture with SVG
            svg.call(tx);

            // Apply texture to all fillable elements
            svg.selectAll('rect.bar, rect.grid-cell, circle, path:not([role="link"])')
                .style('fill', tx.url());
        } catch (e) {
            console.warn('Texture application note:', this.currentTexture, e.message);
        }
    }

    adjustColor(color, percent) {
        // Simple color adjustment function
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, (num >> 16) + amt));
        const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    render() {
        const svgContainer = this.elements.svgContainer;
        svgContainer.innerHTML = '';

        switch (this.currentSample) {
            case 'bar-chart':
                this.createBarChart();
                break;
            case 'pie-chart':
                this.createPieChart();
                break;
            case 'network':
                this.createNetwork();
                break;
            case 'grid':
                this.createGrid();
                break;
            default:
                this.createBarChart();
        }

        // Update code display after rendering
        this.updateCode();
    }

    generateCodeSnippet() {
        const densityMultiplier = this.textureDensity;
        const thicknessMultiplier = this.textureThickness;
        const fgColor = this.currentFgColor;
        const bgColor = this.currentBgColor;

        let textureCode = '';

        if (this.currentTexture === 'noop') {
            textureCode = '// テクスチャなし';
        } else if (['lines', 'diagonal-stripe', 'horizontal-stripe', 'vertical-stripe'].includes(this.currentTexture)) {
            let orientation = 'diagonal';
            if (this.currentTexture === 'horizontal-stripe') orientation = 'horizontal';
            if (this.currentTexture === 'vertical-stripe') orientation = 'vertical';

            textureCode = `const tx = textures.lines()
    .stroke('${fgColor}')
    .background('${bgColor}')
    .size(${8 * densityMultiplier})
    .strokeWidth(${1.5 * thicknessMultiplier});`;

            if (this.currentTexture !== 'lines') {
                textureCode = `const tx = textures.lines()
    .orientation('${orientation}')
    .stroke('${fgColor}')
    .background('${bgColor}')
    .size(${8 * densityMultiplier})
    .strokeWidth(${1.5 * thicknessMultiplier});`;
            }
        } else if (this.currentTexture === 'circles') {
            textureCode = `const tx = textures.circles()
    .stroke('${fgColor}')
    .background('${bgColor}')
    .size(${12 * densityMultiplier})
    .radius(${2 * thicknessMultiplier})
    .strokeWidth(${1 * thicknessMultiplier});`;
        } else if (this.currentTexture === 'dots') {
            textureCode = `const tx = textures.circles()
    .stroke('${fgColor}')
    .background('${bgColor}')
    .size(${10 * densityMultiplier})
    .radius(${1.5 * thicknessMultiplier})
    .strokeWidth(${0.5 * thicknessMultiplier})
    .complement();`;
        } else if (['cross-hatch', 'squares', 'hexagons', 'woven', 'waves', 'caps', 'nylon'].includes(this.currentTexture)) {
            const patternMap = {
                'cross-hatch': 'crosses',
                'squares': 'squares',
                'hexagons': 'hexagons',
                'woven': 'woven',
                'waves': 'waves',
                'caps': 'caps',
                'nylon': 'nylon'
            };
            const pattern = patternMap[this.currentTexture];
            const baseSize = { 'cross-hatch': 8, 'squares': 10, 'hexagons': 12, 'woven': 10, 'waves': 12, 'caps': 10, 'nylon': 12 }[this.currentTexture];
            const baseStroke = { 'cross-hatch': 1, 'squares': 1, 'hexagons': 1.5, 'woven': 1, 'waves': 1.5, 'caps': 1, 'nylon': 1.5 }[this.currentTexture];

            if (this.currentTexture === 'squares') {
                textureCode = `const tx = textures.paths()
    .d('${pattern}')
    .stroke('${fgColor}')
    .fill('${bgColor}')
    .background('${bgColor}')
    .size(${baseSize * densityMultiplier})
    .strokeWidth(${baseStroke * thicknessMultiplier});`;
            } else {
                textureCode = `const tx = textures.paths()
    .d('${pattern}')
    .stroke('${fgColor}')
    .background('${bgColor}')
    .size(${baseSize * densityMultiplier})
    .strokeWidth(${baseStroke * thicknessMultiplier});`;
            }
        }

        const code = `// SVG Texture Editor で生成されたコード
// Textures.js: https://riccardoscalco.it/textures/

// テクスチャの設定
${textureCode}

// SVGに適用
svg.call(tx);

// 塗りつぶし要素にテクスチャを適用
svg.selectAll('rect, circle, path')
    .style('fill', tx.url());`;

        return code;
    }

    updateCode() {
        const code = this.generateCodeSnippet();
        this.elements.codeDisplay.textContent = code;
    }

    copyCodeToClipboard() {
        const code = this.elements.codeDisplay.textContent;
        navigator.clipboard.writeText(code).then(() => {
            // Show feedback
            this.elements.copyFeedback.classList.remove('hidden');
            setTimeout(() => {
                this.elements.copyFeedback.classList.add('hidden');
            }, 2000);
        }).catch(err => {
            console.error('コピーに失敗しました:', err);
        });
    }
}

// Initialize when DOM is ready and libraries are loaded
function initializeEditor() {
    // Check if all required libraries are loaded
    if (typeof d3 === 'undefined') {
        console.warn('Waiting for D3.js to load...');
        setTimeout(initializeEditor, 100);
        return;
    }

    if (typeof textures === 'undefined') {
        console.warn('Waiting for Textures.js to load...');
        setTimeout(initializeEditor, 100);
        return;
    }

    console.log('All libraries loaded. Initializing TextureEditor...');
    new TextureEditor();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEditor);
} else {
    // DOM is already loaded
    initializeEditor();
}
