import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

interface Score {
  score: number;
  name: string;
  date: Date;
}

export async function GET() {
  try {
    const client = await connectToDatabase();
    const db = client.db('nutrition_hunter');
    
    const scores = await db.collection<Score>('scores')
      .find()
      .sort({ score: -1 })
      .limit(10)
      .toArray();
    
    return NextResponse.json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await connectToDatabase();
    const db = client.db('nutrition_hunter');
    
    const { score, name } = await req.json();
    
    if (typeof score !== 'number' || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Invalid score or name' },
        { status: 400 }
      );
    }
    
    await db.collection('scores').insertOne({ 
      score, 
      name: name.trim(), 
      date: new Date() 
    });
    
    return NextResponse.json({ message: 'Score saved' }, { status: 201 });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}