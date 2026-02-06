const HandwritingRecognizer = (() => {
    let canvas, ctx;
    let isDrawing = false;
    let strokes = []; 
    let currentStroke = []; 
    let lastX = 0;
    let lastY = 0;

    const API_URL = 'https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate';

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        canvas.addEventListener('touchstart', handleTouch(startDrawing));
        canvas.addEventListener('touchmove', handleTouch(draw));
        canvas.addEventListener('touchend', handleTouch(stopDrawing));
    }

    function handleTouch(callback) {
        return (e) => {
            e.preventDefault();
            const touch = e.touches[0] || e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const mouseEvent = new MouseEvent(
                e.type === 'touchstart' ? 'mousedown' : 
                e.type === 'touchmove' ? 'mousemove' : 'mouseup', 
                {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                }
            );
            canvas.dispatchEvent(mouseEvent);
        };
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
        
        currentStroke = [];
        currentStroke.push([lastX, lastY]);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getPos(e);
        
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        lastX = pos.x;
        lastY = pos.y;
        currentStroke.push([lastX, lastY]);
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        
        if (currentStroke.length > 0) {
            const xPoints = currentStroke.map(p => Math.round(p[0]));
            const yPoints = currentStroke.map(p => Math.round(p[1]));
            const tPoints = [];
            strokes.push([xPoints, yPoints, tPoints]);
        }
    }

    function clear() {
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokes = [];
        currentStroke = [];
    }

    async function recognize() {
        if (strokes.length === 0) return [];

        const data = JSON.stringify({
            app_version: 0.4,
            api_level: '537.36',
            device: window.navigator.userAgent,
            input_type: 0,
            options: 'enable_pre_space',
            requests: [{
                writing_guide: { writing_area_width: canvas.width, writing_area_height: canvas.height },
                pre_context: "",
                max_num_results: 10,
                max_completions: 0,
                language: "ja",
                ink: strokes
            }]
        });

        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data });
            const result = await response.json();
            if (result[0] === 'SUCCESS' && result[1] && result[1][0] && result[1][0][1]) {
                return result[1][0][1];
            } else {
                return [];
            }
        } catch (error) {
            console.error('Handwriting recognition failed:', error);
            return [];
        }
    }

    return { init, clear, recognize };
})();