import { NextResponse } from 'next/server';
import { ordersStore, Order } from '@/lib/orders';
import { SERVICES_DATA } from '@/lib/data';

export async function GET() {
  return NextResponse.json({ success: true, orders: ordersStore });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serviceId, packageId, targetAccount } = body;

    const service = SERVICES_DATA.find((s) => s.id === serviceId);
    if (!service) {
      return NextResponse.json({ success: false, message: 'مۇلازىمەت تېپىلمىدى' }, { status: 404 });
    }

    const pkg = service.packages.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, message: 'تاللانغان تۈر تېپىلمىدى' }, { status: 404 });
    }

    const newOrderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    let generatedDetails: Order['details'] = {};

    // Automatic mock behavior based on category
    if (service.category === 'numbers') {
      const randomUS = `+1 (${Math.floor(200 + Math.random() * 700)}) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
      generatedDetails = {
        virtualNumber: randomUS,
        smsCode: 'كود كۈتۈلمەكتە (تەخمىنەن 10-30 سېكۇنت)...',
      };
    } else if (service.category === 'cards') {
      const cardNum = `4242 84${Math.floor(10 + Math.random() * 89)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
      generatedDetails = {
        cardDetails: {
          number: cardNum,
          exp: '12/28',
          cvv: `${Math.floor(100 + Math.random() * 900)}`,
        },
      };
    } else if (service.category === 'ai') {
      generatedDetails = {
        accountCredentials: `${targetAccount} ھېساباتىغا سىستېما تەرىپىدىن تولۇقلاش تەستىق باسقۇچىغا ئۆتتى.`,
      };
    }

    const newOrder: Order = {
      id: newOrderId,
      serviceId: service.id,
      serviceName: service.name,
      packageTitle: pkg.title,
      amount: pkg.price,
      targetAccount: targetAccount || 'تەلەپ قىلىنمىغان',
      status: service.category === 'numbers' ? 'processing' : 'completed',
      createdAt: new Date().toISOString(),
      details: generatedDetails,
    };

    ordersStore.unshift(newOrder);

    return NextResponse.json({ success: true, order: newOrder });
  } catch {
    return NextResponse.json({ success: false, message: 'زاكاز مەغلۇپ بولدى' }, { status: 500 });
  }
}
