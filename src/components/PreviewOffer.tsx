import type { PreviewOffer as Offer } from "../lib/previewOffers";

type Props = {
  offer: Offer;
  onPreview: () => void;
  onDismiss: () => void;
};

/** One-click jump into preview when the buffer matches a preview plugin. */
export function PreviewOfferBar({ offer, onPreview, onDismiss }: Props) {
  return (
    <div className="preview-offer" role="region" aria-label="Preview available">
      <span>
        <strong>{offer.label}</strong> is available for this buffer
      </span>
      <div className="preview-offer-actions">
        <button type="button" className="primary" onClick={onPreview}>
          Open preview
        </button>
        <button type="button" className="ghost" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}
