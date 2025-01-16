import {useParams} from 'react-router-dom'
function Project() {
    const {name} = useParams<{name: string}>()
  return (
    <div>Project {name}</div>
  )
}

export default Project