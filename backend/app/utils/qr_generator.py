"""QR code generation utilities."""
import io
import uuid

import qrcode


def generate_qr_code(data: str) -> bytes:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_book_codes() -> dict:
    uid = uuid.uuid4().hex[:8].upper()
    return {
        "book_code": f"SD-{uid}",
        "qr_code": f"QR-SD-{uid}",
        "barcode": f"BC{uid}",
    }
