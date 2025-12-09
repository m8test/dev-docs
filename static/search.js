document.addEventListener('DOMContentLoaded', () => {

    let fuse = null;
    let isLoading = false; // 新增：用于跟踪加载状态，防止重复请求

    // 1. 动态注入所有需要的 CSS 样式 (代码无变化)
    const styles = `
    #custom-search-fab {
    position: fixed;
    bottom: 25px;
    right: 25px;
    width: 56px;
    height: 56px;
    background-color: #2c3e50;
    border-radius: 50%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 9999;
    transition: transform 0.2s ease-in-out;
}

#custom-search-fab:hover {
    transform: scale(1.1);
}

#custom-search-fab svg {
    width: 24px;
    height: 24px;
    fill: #ecf0f1;
}

#custom-search-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: none;
    justify-content: center;
    align-items: flex-start;
    padding-top: 10vh;
}

#custom-search-modal {
    width: 90%;
    max-width: 700px;
    background-color: #2c3e50;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
}

.search-modal-header {
    padding: 16px;
    border-bottom: 1px solid #34495e;
    display: flex;
    align-items: center;
}

#custom-search-input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 1.2em;
    padding: 8px;
    background-color: #34495e;
    color: #ecf0f1;
}

#custom-search-results {
    max-height: 60vh;
    overflow-y: auto;
    padding: 8px 0;
}

.search-result-item {
    display: block;
    padding: 12px 24px;
    text-decoration: none;
    color: #ecf0f1;
    border-bottom: 1px solid #34495e;
}

.search-result-item:hover {
    background-color: #34495e;
}

.result-title {
    font-weight: bold;
    font-size: 1.1em;
    color: #3498db;
}

.result-breadcrumbs {
    font-size: 0.9em;
    color: #bdc3c7;
    margin-top: 4px;
}

.result-snippet {
    font-size: 0.9em;
    color: #ecf0f1;
    margin-top: 6px;
}

.search-modal-footer {
    padding: 8px;
    text-align: right;
    font-size: 0.8em;
    color: #95a5a6;
    border-top: 1px solid #34495e;
}    
  `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // 2. 动态创建 HTML 元素 (代码无变化)
    const fab = document.createElement('div');
    fab.id = 'custom-search-fab';
    fab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>';
    document.body.appendChild(fab);

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'custom-search-modal-overlay';
    modalOverlay.innerHTML = `
    <div id="custom-search-modal">
      <div class="search-modal-header">
        <input type="text" id="custom-search-input" placeholder="搜索文档...">
      </div>
      <div id="custom-search-results">
        <div style="text-align: center; padding: 20px; color: #888;">输入内容以开始搜索</div>
      </div>
      <div class="search-modal-footer">
        <span>2025 M8Test. All rights reserved.</span>
      </div>
    </div>
  `;
    document.body.appendChild(modalOverlay);

    const searchInput = document.getElementById('custom-search-input');
    const resultsContainer = document.getElementById('custom-search-results');
    const modalDiv = document.getElementById('custom-search-modal');


    // 3. 设置事件监听
    // 点击悬浮按钮，显示模态框并按需加载数据
    fab.addEventListener('click', () => {
        modalOverlay.style.display = 'flex';
        searchInput.focus();

        // **修改部分**: 只有在 fuse 未初始化且未在加载中时，才去加载数据
        if (!fuse && !isLoading) {
            isLoading = true;
            // 显示加载提示
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">正在加载搜索数据...</div>';

            // 4. 加载数据并初始化 Fuse.js (逻辑移动到此处)
            fetch('static/search-data.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    const options = {
                        keys: [
                            {name: 'mainTitle', weight: 2},
                            {name: 'headings', weight: 1.5},
                            {name: 'content', weight: 1},
                            {name: 'breadcrumbs', weight: 0.8}
                        ],
                        includeScore: true,
                        includeMatches: true,
                        minMatchCharLength: 2,
                        threshold: 0.4,
                        ignoreLocation: true,
                    };
                    fuse = new Fuse(data, options);
                    console.log('独立的 Fuse.js 搜索服务已在首次点击时初始化。');
                    // 初始化完成后，根据输入框当前内容决定显示什么
                    if(searchInput.value.length < 2) {
                        resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">请输入至少2个字符</div>';
                    } else {
                        // 如果用户在加载时已经输入了内容，则立即触发一次搜索
                        searchInput.dispatchEvent(new Event('input'));
                    }
                })
                .catch(error => {
                    console.error('加载搜索数据失败:', error);
                    // 显示错误提示
                    resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #d9534f;">加载搜索数据失败，请刷新页面重试。</div>';
                })
                .finally(() => {
                    isLoading = false; // 无论成功或失败，都结束加载状态
                });
        }
    });

    // 点击模态框背景，关闭模态框 (代码无变化)
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });

    // 按下 Escape 键关闭模态框 (代码无变化)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
            modalOverlay.style.display = 'none';
        }
    });

    // 5. 实现搜索逻辑和结果渲染 (代码无变化)
    searchInput.addEventListener('input', (e) => {
        // 如果正在加载中，则不执行搜索
        if (!fuse || isLoading) return;

        const query = e.target.value;
        resultsContainer.innerHTML = '';

        if (query.length < 2) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">请输入至少2个字符</div>';
            return;
        }

        const results = fuse.search(query, {limit: 20});

        if (results.length > 0) {
            results.forEach(({item, score, matches}) => {
                const resultEl = document.createElement('a');
                resultEl.className = 'search-result-item';
                resultEl.href = item.url;

                resultEl.addEventListener('click', () => {
                    modalOverlay.style.display = 'none';
                });

                let snippet = '';
                const match = matches.find(m => m.key === 'content' || m.key === 'headings');
                if (match) {
                    const {value, indices} = match;
                    const start = Math.max(0, indices[0][0] - 30);
                    const end = Math.min(value.length, indices[0][1] + 30);
                    snippet = `...${value.substring(start, end)}...`;
                } else {
                    snippet = item.content.substring(0, 100) + '...';
                }

                resultEl.innerHTML = `
                  <div class="result-title">${item.mainTitle}</div>
                  <div class="result-breadcrumbs">${item.breadcrumbs.replace(/\/\/\//g, ' › ')}</div>
                  <div class="result-snippet">${snippet.replace(/</g, "<").replace(/>/g, ">")}</div>
                `;
                resultsContainer.appendChild(resultEl);
            });
        } else {
            resultsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #888;">未找到与 "${query}" 相关的结果</div>`;
        }
    });
});