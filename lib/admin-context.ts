export const getAdminContext = () => {
    if (typeof window === 'undefined') return { propertyId: 'ALL' }
    const propertyId = localStorage.getItem('super_admin_property_context') || 'ALL'
    return { propertyId }
}

export const buildContextUrl = (baseUrl: string, params: Record<string, string | null | undefined> = {}) => {
    const { propertyId } = getAdminContext()
    const url = new URL(baseUrl, window.location.origin)

    // Add base params
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value)
    })

    // Add property context if not already present
    if (!url.searchParams.has('propertyId')) {
        url.searchParams.append('propertyId', propertyId)
    }

    return url.toString()
}
