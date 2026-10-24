export async function openOrderReceiptForPrint(axios, order) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    const error = new Error('Popup blocked');
    error.code = 'POPUP_BLOCKED';
    throw error;
  }

  try {
    const response = await axios.get(
      `/api/enduser/profile/orders/${encodeURIComponent(order.id)}/receipt/print`,
      { responseType: 'text' },
    );
    const html = response.data;
    if (typeof html !== 'string' || !/<html[\s>]/i.test(html)) {
      throw new Error('Invalid receipt response');
    }

    let printStarted = false;
    const startPrint = () => {
      if (printStarted || printWindow.closed) return;
      printStarted = true;
      printWindow.focus();
      printWindow.print();
    };

    printWindow.addEventListener('load', startPrint, { once: true });
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    window.setTimeout(startPrint, 500);
  } catch (error) {
    printWindow.close();
    throw error;
  }
}
