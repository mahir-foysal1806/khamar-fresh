import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export default function NotFound() {
  return (
    <div className="container-x py-16">
      <Empty icon="🌿" title="Page not found" text="The page or product you are looking for is not available."><Link to="/" className="btn-primary">Back to home</Link><Link to="/shop" className="btn-outline">Shop</Link></Empty>
    </div>
  );
}
