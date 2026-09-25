import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://affiliate.pulseisp.com';

  // Base static public pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch active regional partner programs dynamically
  try {
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const programPages: MetadataRoute.Sitemap = programs.map((prog) => ({
      url: `${baseUrl}/register?program=${encodeURIComponent(prog.slug)}`,
      lastModified: prog.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...staticPages, ...programPages];
  } catch (error) {
    console.error('Error generating dynamic sitemap for programs:', error);
    return staticPages;
  }
}
