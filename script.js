document.addEventListener('DOMContentLoaded', () => {

    // --- Step 3: Authentication Logic ---
    const authModal = document.getElementById('auth-modal');
    const appContent = document.getElementById('app-content');
    
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Function to show the main application
    const showApp = () => {
        authModal.classList.add('hidden');
        appContent.classList.remove('hidden');
    };

    // Event listeners for switching between login and register forms
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });

    // Handle login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, you'd send data to a server here
        console.log('Simulating login...');
        showApp();
    });

    // Handle register form submission
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, you'd send data to a server here
        console.log('Simulating registration...');
        showApp();
    });


    // --- K-Map Solver Logic (existing code) ---
    const variableSelect = document.getElementById('variable-select');
    const solveButton = document.getElementById('solve-button');
    const resetButton = document.getElementById('reset-button');
    const kmapWrapper = document.getElementById('kmap-wrapper');
    const solutionText = document.getElementById('solution');
    const explanationContainer = document.getElementById('explanation-container');

    let numVars = 4;
    let cells = [];
    const groupColors = ['Orange', 'Green', 'Pink', 'Purple', 'Blue', 'Gold'];

    const createKMap = () => {
        kmapWrapper.innerHTML = '';
        solutionText.textContent = '';
        explanationContainer.innerHTML = '';
        cells = [];

        let rows, cols, rowLabels, colLabels;
        
        if (numVars === 2) {
            rows = 2; cols = 2;
            rowLabels = ['0', '1']; colLabels = ['0', '1'];
        } else if (numVars === 3) {
            rows = 2; cols = 4;
            rowLabels = ['0', '1']; colLabels = ['00', '01', '11', '10'];
        } else { // 4 variables
            rows = 4; cols = 4;
            rowLabels = ['00', '01', '11', '10']; colLabels = ['00', '01', '11', '10'];
        }
        
        const kmapContainer = document.createElement('div');
        kmapContainer.id = 'kmap-container';
        kmapContainer.style.position = 'relative';
        kmapContainer.style.width = '100%';
        
        const grid = document.createElement('div');
        grid.className = 'kmap-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        for (let r = 0; r < rows; r++) {
            const rowArr = [];
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'kmap-cell';
                cell.textContent = '0';
                cell.addEventListener('click', () => {
                    cell.textContent = cell.textContent === '0' ? '1' : (cell.textContent === '1' ? 'X' : '0');
                });
                grid.appendChild(cell);
                rowArr.push(cell);
            }
            cells.push(rowArr);
        }
        kmapContainer.appendChild(grid);
        kmapWrapper.appendChild(kmapContainer);
        addLabels(rowLabels, colLabels);
    };
    
    const addLabels = (rowLabels, colLabels) => {
        let sideVarName, topVarName;

        if (numVars === 2) { sideVarName = 'C'; topVarName = 'D'; }
        else if (numVars === 3) { sideVarName = 'A'; topVarName = 'BC'; }
        else { 
            sideVarName = 'CD'; 
            topVarName = 'AB'; 
        }

        const rowBitLabelContainer = document.createElement('div');
        rowBitLabelContainer.className = 'labels row-bit-labels';
        rowLabels.forEach(label => {
            const div = document.createElement('div'); div.textContent = label;
            rowBitLabelContainer.appendChild(div);
        });

        const colBitLabelContainer = document.createElement('div');
        colBitLabelContainer.className = 'labels col-bit-labels';
        colLabels.forEach(label => {
            const div = document.createElement('div'); div.textContent = label;
            colBitLabelContainer.appendChild(div);
        });
        
        const sideVars = document.createElement('div');
        sideVars.className = 'labels var-label-side';
        sideVars.textContent = sideVarName;

        const topVars = document.createElement('div');
        topVars.className = 'labels var-label-top';
        topVars.textContent = topVarName;

        kmapWrapper.append(rowBitLabelContainer, colBitLabelContainer, sideVars, topVars);
    };

    const solveKMap = () => {
        const rows = cells.length, cols = cells[0].length;
        const minterms = [];
        explanationContainer.innerHTML = '<h2>Explanation of Terms:</h2>';

        cells.flat().forEach(cell => {
            cell.classList.remove(...Array.from(cell.classList).filter(cl => cl.startsWith('group-highlight')));
        });
        
        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                if (cells[r][c].textContent !== '0') {
                    minterms.push({r, c});
                }
            }
        }
        
        if (minterms.length === 0) { solutionText.textContent = "0"; explanationContainer.innerHTML = ''; return; }
        if (minterms.length === rows * cols) { solutionText.textContent = "1"; explanationContainer.innerHTML = ''; return; }

        const groups = findGroups(minterms, rows, cols);
        const essentialTerms = selectEssentialGroups(groups, minterms);
        
        const finalExpression = essentialTerms.map(term => termToExpression(term)).join(' + ');
        solutionText.textContent = finalExpression || '0';
        
        if (essentialTerms.length === 0) {
            explanationContainer.innerHTML = '';
        }

        essentialTerms.forEach((group, i) => {
            const explanation = getTermExplanation(group, i);
            explanationContainer.innerHTML += explanation;
            
            group.minterms.forEach(mt => {
                cells[mt.r][mt.c].classList.add(`group-highlight-${i % groupColors.length}`);
            });
        });
    };
    
    const findGroups = (minterms, rows, cols) => {
        const implicants = [];
        const checked = new Set();
        const mintermMap = new Map(minterms.map(mt => [`${mt.r},${mt.c}`, mt]));
        
        for(let h = rows; h > 0; h /= 2){
            for(let w = cols; w > 0; w /= 2){
                if (h*w === 0) continue;
                for(let r_start = 0; r_start < rows; r_start++){
                    for(let c_start = 0; c_start < cols; c_start++){
                        const group = []; let isValid = true;
                        for(let r = 0; r < h; r++){
                            for(let c = 0; c < w; c++){
                                const cur_r = (r_start + r) % rows;
                                const cur_c = (c_start + c) % cols;
                                if(mintermMap.has(`${cur_r},${cur_c}`)){
                                    group.push(mintermMap.get(`${cur_r},${cur_c}`));
                                } else { isValid = false; break; }
                            }
                            if(!isValid) break;
                        }
                        if(isValid && group.length === h*w){
                            const key = group.map(m=>`${m.r},${m.c}`).sort().join(';');
                            if(!checked.has(key)){
                                implicants.push({minterms: group, size: group.length});
                                checked.add(key);
                            }
                        }
                    }
                }
            }
        }
        return implicants.sort((a, b) => b.size - a.size || a.minterms.length - b.minterms.length);
    };

    const selectEssentialGroups = (groups, minterms) => {
        const uncoveredMinterms = new Set(minterms.map(mt => `${mt.r},${mt.c}`));
        const finalGroups = [];
        
        for(const group of groups){
            const mintermCoords = group.minterms.map(mt => `${mt.r},${mt.c}`);
            const coversNew = mintermCoords.some(coord => uncoveredMinterms.has(coord));
            if(coversNew){
                finalGroups.push(group);
                mintermCoords.forEach(coord => uncoveredMinterms.delete(coord));
            }
            if(uncoveredMinterms.size === 0) break;
        }
        return finalGroups;
    };
    
    const getBinaryRepresentation = (cell) => {
        const rowMap = ['00', '01', '11', '10'], colMap = ['00', '01', '11', '10'];
        if(numVars === 2) return colMap[cell.c].slice(1) + rowMap[cell.r].slice(1);
        if(numVars === 3) return rowMap[cell.r].slice(1) + colMap[cell.c];
        return colMap[cell.c] + rowMap[cell.r];
    };

    const termToExpression = (group) => {
        const binaryReps = group.minterms.map(getBinaryRepresentation);
        const vars = numVars === 2 ? ['A', 'B'] : ['A', 'B', 'C', 'D'].slice(0, numVars);
        let expression = '';

        for (let i = 0; i < numVars; i++) {
            const firstBit = binaryReps[0][i];
            if (binaryReps.every(br => br[i] === firstBit)) {
                expression += vars[i] + (firstBit === '0' ? "'" : "");
            }
        }
        return expression || '1';
    };

    const getTermExplanation = (group, groupIndex) => {
        const binaryReps = group.minterms.map(getBinaryRepresentation);
        const vars = numVars === 2 ? ['A', 'B'] : ['A', 'B', 'C', 'D'].slice(0, numVars);
        let explanation = `<p><b>Group ${groupIndex + 1} (${groupColors[groupIndex % groupColors.length]}):</b><br/>`;
        
        for (let i = 0; i < numVars; i++) {
            const firstBit = binaryReps[0][i];
            if (binaryReps.every(br => br[i] === firstBit)) {
                explanation += `&bull; For variable <b>${vars[i]}</b>, the bit is always <b>${firstBit}</b>. This gives the term <b>${vars[i]}${firstBit === '0' ? "'" : ""}</b>.<br/>`;
            } else {
                explanation += `&bull; For variable <b>${vars[i]}</b>, the bits change within the group, so it is eliminated.<br/>`;
            }
        }
        explanation += `Resulting Term: <b>${termToExpression(group)}</b></p>`;
        return explanation;
    };

    variableSelect.addEventListener('change', (e) => {
        numVars = parseInt(e.target.value);
        createKMap();
    });

    solveButton.addEventListener('click', solveKMap);
    resetButton.addEventListener('click', createKMap);

    // Initial K-Map setup call
    createKMap(); 
});
