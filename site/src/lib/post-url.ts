export function postSlug(post: { id: string; data: { slug?: string } }) {
  return post.data.slug || post.id;
}

export function postPath(post: { id: string; data: { slug?: string } }) {
  return `/post/${postSlug(post)}/`;
}
