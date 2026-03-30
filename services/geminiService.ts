type StreamMetadata = { title: string; description: string; hashtags: string[] };

const fallbackMetadata = (topic: string): StreamMetadata => ({
  title: `${topic} - Live Stream`,
  description: `Watch as we dive deep into ${topic}. Streaming now!`,
  hashtags: ['#live', '#streaming', `#${topic.replace(/\s/g, '')}`]
});

export const generateStreamMetadata = async (topic: string) => {
  if (!topic?.trim()) {
    return { title: 'New Live Stream', description: 'Join me live!', hashtags: ['#live'] };
  }

  try {
    const response = await fetch('/api/ai/generate-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topic.trim() }),
    });

    if (!response.ok) {
      throw new Error(`Metadata generation failed (${response.status})`);
    }

    const data = (await response.json()) as Partial<StreamMetadata>;
    if (
      typeof data.title !== 'string' ||
      typeof data.description !== 'string' ||
      !Array.isArray(data.hashtags)
    ) {
      throw new Error('Invalid metadata response payload');
    }

    return {
      title: data.title,
      description: data.description,
      hashtags: data.hashtags.filter((tag): tag is string => typeof tag === 'string'),
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return fallbackMetadata(topic);
  }
};
