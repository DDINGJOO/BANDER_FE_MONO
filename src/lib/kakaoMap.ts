import { getKakaoJavaScriptKey } from '../config/publicEnv';

type KakaoWindow = Window & {
  kakao?: {
    maps: {
      load: (callback: () => void) => void;
    };
  };
};

let kakaoLoaderPromise: Promise<void> | null = null;

const SDK_LOAD_FAILED_HINT =
  '카카오맵 SDK 로드에 실패했습니다. 카카오 Developers → 내 애플리케이션 → 플랫폼 Web에 ' +
  '개발 주소(예: http://localhost:3000)를 등록했는지, appkey에 JavaScript 키를 썼는지, ' +
  '브라우저 확장 프로그램이 dapi.kakao.com을 차단하지 않는지 확인해 주세요.';

function appendKakaoScript(appKey: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const globalWindow = window as KakaoWindow;
    const existing = document.querySelector<HTMLScriptElement>('script[data-bander-kakao-maps-sdk="1"]');
    if (existing) {
      if (globalWindow.kakao?.maps) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(SDK_LOAD_FAILED_HINT)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.dataset.banderKakaoMapsSdk = '1';
    /** 공식 가이드와 동일: // 프로토콜 */
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${encodeURIComponent(appKey)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(SDK_LOAD_FAILED_HINT));
    document.head.appendChild(script);
  });
}

export function loadKakaoMapSdk(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 카카오맵을 로드할 수 있습니다.'));
  }

  if (!kakaoLoaderPromise) {
    kakaoLoaderPromise = (async () => {
      const appKey = getKakaoJavaScriptKey();
      if (!appKey) {
        throw new Error('REACT_APP_KAKAO_JAVASCRIPT_KEY 값이 없습니다.');
      }

      const globalWindow = window as KakaoWindow;
      if (!globalWindow.kakao?.maps) {
        await appendKakaoScript(appKey);
      }

      const maps = globalWindow.kakao?.maps;
      if (!maps?.load) {
        throw new Error(
          '카카오맵 SDK가 응답했지만 kakao.maps를 찾을 수 없습니다. JavaScript 키·Web 도메인 설정을 확인해 주세요.'
        );
      }

      await new Promise<void>((resolve, reject) => {
        try {
          maps.load(() => resolve());
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      });
    })().catch((err) => {
      kakaoLoaderPromise = null;
      throw err;
    });
  }

  return kakaoLoaderPromise;
}
