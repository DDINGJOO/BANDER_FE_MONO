import React from 'react';
import { ChevronIcon } from '../shared/Icons';
import type { VendorBasicInfoRow } from '../../types/vendorBasicInfo';
import { vendorBasicInfoRowLabel } from '../../types/vendorBasicInfo';

export type VendorBasicInfoSectionProps = {
  onCopy?: (text: string) => void;
  rows: VendorBasicInfoRow[];
};

function ChevronTrailing() {
  return (
    <span aria-hidden="true" className="vendor-basic-info__chevron">
      <ChevronIcon />
    </span>
  );
}

function AddressRow({ row }: { row: Extract<VendorBasicInfoRow, { field: 'address' }> }) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{vendorBasicInfoRowLabel(row)}</span>
      <div className="vendor-detail__info-value-wrap">
        <div className="vendor-basic-info__value-row">
          <div className="vendor-basic-info__text-stack">
            <span className="vendor-detail__info-value">{row.primaryLine}</span>
            {row.secondaryLine ? (
              <p className="vendor-detail__info-sub vendor-basic-info__sub">{row.secondaryLine}</p>
            ) : null}
          </div>
          <ChevronTrailing />
        </div>
      </div>
    </div>
  );
}

function DirectionsRow({ row }: { row: Extract<VendorBasicInfoRow, { field: 'directions' }> }) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{vendorBasicInfoRowLabel(row)}</span>
      <div className="vendor-detail__info-value-wrap">
        <div className="vendor-basic-info__value-row">
          <span className="vendor-detail__info-value vendor-basic-info__main-text">{row.primaryLine}</span>
          <ChevronTrailing />
        </div>
      </div>
    </div>
  );
}

function HoursRow({ row }: { row: Extract<VendorBasicInfoRow, { field: 'hours' }> }) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{vendorBasicInfoRowLabel(row)}</span>
      <div className="vendor-detail__info-value-wrap">
        <div className="vendor-basic-info__value-row">
          <div className="vendor-basic-info__hours">
            {row.dayLabel ? <span className="vendor-basic-info__day-label">{row.dayLabel}</span> : null}
            <span className="vendor-detail__info-value">{row.hoursLine}</span>
          </div>
          <ChevronTrailing />
        </div>
      </div>
    </div>
  );
}

function PhoneRow({
  onCopy,
  row,
}: {
  onCopy?: (text: string) => void;
  row: Extract<VendorBasicInfoRow, { field: 'phone' }>;
}) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{vendorBasicInfoRowLabel(row)}</span>
      <div className="vendor-detail__info-value-wrap">
        <div className="vendor-basic-info__value-row vendor-basic-info__value-row--phone">
          <span className="vendor-detail__info-value">{row.phone}</span>
          <button
            aria-label="전화번호 복사"
            className="vendor-detail__copy-btn"
            onClick={() => onCopy?.(row.phone)}
            type="button"
          >
            복사
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ row }: { row: Extract<VendorBasicInfoRow, { field: 'price' }> }) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{vendorBasicInfoRowLabel(row)}</span>
      <div className="vendor-detail__info-value-wrap">
        <div className="vendor-basic-info__value-row">
          <span className="vendor-detail__info-value vendor-basic-info__main-text">{row.line}</span>
          <ChevronTrailing />
        </div>
      </div>
    </div>
  );
}

function CapacityRow({ row }: { row: Extract<VendorBasicInfoRow, { field: 'capacity' }> }) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{vendorBasicInfoRowLabel(row)}</span>
      <div className="vendor-detail__info-value-wrap">
        <span className="vendor-detail__info-value">{row.value}</span>
      </div>
    </div>
  );
}

function ParkingRow({ row }: { row: Extract<VendorBasicInfoRow, { field: 'parking' }> }) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{vendorBasicInfoRowLabel(row)}</span>
      <div className="vendor-detail__info-value-wrap">
        <div className="vendor-basic-info__value-row">
          <div className="vendor-basic-info__parking">
            <span className="vendor-detail__info-value">{row.left}</span>
            {row.right ? (
              <>
                <span aria-hidden="true" className="vendor-detail__dot vendor-basic-info__parking-dot" />
                <span className="vendor-detail__info-value">{row.right}</span>
              </>
            ) : null}
          </div>
          <ChevronTrailing />
        </div>
      </div>
    </div>
  );
}

function ExtraLinkRow({ row }: { row: Extract<VendorBasicInfoRow, { field: 'extra_link' }> }) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{vendorBasicInfoRowLabel(row)}</span>
      <div className="vendor-detail__info-value-wrap">
        <a className="vendor-detail__info-link" href={row.href} rel="noopener noreferrer" target="_blank">
          {row.displayText}
        </a>
      </div>
    </div>
  );
}

function CustomRow({ row }: { row: Extract<VendorBasicInfoRow, { field: 'custom' }> }) {
  return (
    <div className="vendor-detail__info-row vendor-basic-info__row">
      <span className="vendor-detail__info-label">{row.label}</span>
      <div className="vendor-detail__info-value-wrap">
        <div className="vendor-basic-info__value-row">
          <span className="vendor-detail__info-value vendor-basic-info__main-text">{row.value}</span>
          {row.trailingChevron ? <ChevronTrailing /> : null}
        </div>
      </div>
    </div>
  );
}

export function VendorBasicInfoSection({ onCopy, rows }: VendorBasicInfoSectionProps) {
  return (
    <div className="vendor-detail__info-rows vendor-basic-info">
      {rows.map((row, i) => {
        const key = `${row.field}-${i}`;
        switch (row.field) {
          case 'address':
            return <AddressRow key={key} row={row} />;
          case 'capacity':
            return <CapacityRow key={key} row={row} />;
          case 'custom':
            return <CustomRow key={key} row={row} />;
          case 'directions':
            return <DirectionsRow key={key} row={row} />;
          case 'extra_link':
            return <ExtraLinkRow key={key} row={row} />;
          case 'hours':
            return <HoursRow key={key} row={row} />;
          case 'parking':
            return <ParkingRow key={key} row={row} />;
          case 'phone':
            return <PhoneRow key={key} onCopy={onCopy} row={row} />;
          case 'price':
            return <PriceRow key={key} row={row} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
