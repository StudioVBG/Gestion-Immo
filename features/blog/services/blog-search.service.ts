import { blogService } from "./blog.service";
import type { BlogPost } from "@/lib/types";

export class BlogSearchService {
  async searchPosts(query: string): Promise<BlogPost[]> {
    if (!query || query.trim().length === 0) {
      return await blogService.getPublishedPosts();
    }

    const allPosts = await blogService.getPublishedPosts();
    const searchTerm = query.toLowerCase().trim();

    // Recherche simple dans le titre et le contenu
    return allPosts.filter((post) => {
      const titleMatch = post.titre.toLowerCase().includes(searchTerm);
      const contentMatch = post.contenu.toLowerCase().includes(searchTerm);
      const tagMatch = post.tags?.some((tag) => tag.toLowerCase().includes(searchTerm));

      return titleMatch || contentMatch || tagMatch;
    });
  }

  async searchByTag(tag: string): Promise<BlogPost[]> {
    return await blogService.getPostsByTag(tag);
  }
}

export const blogSearchService = new BlogSearchService();

