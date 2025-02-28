export type Content = {
    title: string
    content?: string
    image?: string
    imageRoughness?: string
}

export type Page = {
    id: string
    contentFront: Content
    contentBack: Content
}
