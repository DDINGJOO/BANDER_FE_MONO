import React from 'react';
import { AppleIcon, GoogleIcon, KakaoIcon } from '../shared/Icons';

type GuestGateModalProps = {
  onClose: () => void;
  onProceed: () => void;
  open: boolean;
};

export function GuestGateModal({ onClose, onProceed, open }: GuestGateModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="home-guest-modal">
      <div className="home-guest-modal__backdrop" onClick={onClose} />
      <div className="home-guest-modal__dialog" role="dialog" aria-modal="true">
        <div className="home-guest-modal__logo">b</div>
        <div className="home-guest-modal__copy">
          <p className="home-guest-modal__title">안녕하세요 게스트님!</p>
          <p className="home-guest-modal__description">
            10초만에 회원가입하고 밴더의 모든 서비스를 자유롭게 이용해보세요.
          </p>
        </div>
        <div className="home-guest-modal__socials">
          <KakaoIcon />
          <GoogleIcon />
          <AppleIcon />
        </div>
        <button className="home-guest-modal__button" onClick={onProceed} type="button">
          로그인/회원가입 하기
        </button>
      </div>
    </div>
  );
}
