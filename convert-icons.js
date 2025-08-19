const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// SVG 템플릿 생성 함수
function createSVG(size) {
    const scale = size / 128;
    const strokeWidth = Math.max(2, 4 * scale);
    const cursorWidth = Math.max(2, 3 * scale);
    const lineHeight = Math.max(2, 3 * scale);
    
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0052CC;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 배경 -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.15}" ry="${size * 0.15}" fill="url(#bgGradient)" />
  
  <!-- 검색 돋보기 -->
  <g>
    <circle cx="${size * 0.35}" cy="${size * 0.35}" r="${size * 0.14}" stroke="white" stroke-width="${strokeWidth}" fill="none" />
    <line x1="${size * 0.44}" y1="${size * 0.44}" x2="${size * 0.55}" y2="${size * 0.55}" stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" />
  </g>
  
  <!-- 자동완성 표시 -->
  <g>
    <!-- 커서 -->
    <rect x="${size * 0.65}" y="${size * 0.28}" width="${cursorWidth}" height="${size * 0.15}" fill="white" opacity="0.9" />
    
    <!-- 제안 라인들 -->
    <rect x="${size * 0.5}" y="${size * 0.65}" width="${size * 0.35}" height="${lineHeight}" rx="${lineHeight/2}" fill="white" opacity="0.8" />
    <rect x="${size * 0.5}" y="${size * 0.73}" width="${size * 0.28}" height="${lineHeight}" rx="${lineHeight/2}" fill="white" opacity="0.6" />
    <rect x="${size * 0.5}" y="${size * 0.81}" width="${size * 0.32}" height="${lineHeight}" rx="${lineHeight/2}" fill="white" opacity="0.5" />
  </g>
</svg>`;
}

async function generateIcons() {
    const sizes = [128, 48, 32, 16];
    const iconsDir = path.join(__dirname, 'public', 'icons');
    
    try {
        // icons 디렉토리 확인 및 생성
        await fs.mkdir(iconsDir, { recursive: true });
        
        console.log('🎨 Braze Autocomplete Extension 아이콘 생성 중...\n');
        
        // 각 사이즈별로 아이콘 생성
        for (const size of sizes) {
            const svg = createSVG(size);
            const outputPath = path.join(iconsDir, `icon-${size}.png`);
            
            await sharp(Buffer.from(svg))
                .png()
                .toFile(outputPath);
            
            console.log(`✅ icon-${size}.png 생성 완료`);
        }
        
        console.log('\n🚀 모든 아이콘이 성공적으로 생성되었습니다!');
        console.log('📁 위치: public/icons/');
        
    } catch (error) {
        console.error('❌ 아이콘 생성 중 오류 발생:', error);
        console.log('\n💡 sharp 패키지가 필요합니다:');
        console.log('   npm install sharp --save-dev');
    }
}

generateIcons();

