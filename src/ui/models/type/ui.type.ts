export interface ItemProps {
  label: string
  value: string
}

export interface CommandProps {
  type: string
}

export interface ContainerListProps {
  id: string
  names: string[]
  image: string
  status: string
  state: string
  created: number
  ports?: string[]
}
