export default function Session({ params }: { params: { slug: string } }) {
    return <div>session: {params.slug}</div>
}