export default function Notification(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
    // 创建通知容器
    const notification = document.createElement('div');
    
    // 根据类型设置颜色
    const colors = {
        success: { bg: '#4caf50', icon: '✓' },
        error: { bg: '#f44336', icon: '✕' },
        info: { bg: '#2196f3', icon: 'i' }
    };
    
    const color = colors[type];
    
    // 设置样式
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: color.bg,
        color: '#ffffff',
        padding: '16px 48px 16px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '999999',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        maxWidth: '400px',
        minWidth: '250px',
        wordWrap: 'break-word',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: 'auto'
    });
    
    // 创建图标
    const icon = document.createElement('span');
    icon.textContent = color.icon;
    Object.assign(icon.style, {
        fontSize: '18px',
        fontWeight: 'bold',
        flexShrink: '0'
    });
    
    // 创建消息文本
    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    Object.assign(messageEl.style, {
        flex: '1',
        lineHeight: '1.5'
    });
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'transparent',
        border: 'none',
        color: '#ffffff',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '0',
        width: '24px',
        height: '24px',
        lineHeight: '24px',
        textAlign: 'center',
        opacity: '0.8',
        transition: 'opacity 0.2s ease'
    });
    
    // 鼠标悬停效果
    closeBtn.onmouseover = () => {
        closeBtn.style.opacity = '1';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.opacity = '0.8';
    };
    
    // 关闭函数
    const close = () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    };
    
    // 点击关闭按钮
    closeBtn.onclick = close;
    
    // 组装元素
    notification.appendChild(icon);
    notification.appendChild(messageEl);
    notification.appendChild(closeBtn);
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 触发动画（需要在下一帧执行）
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
    });
    
    // 自动关闭
    if (duration > 0) {
        setTimeout(close, duration);
    }
    
    return notification;
}
