import { useFormik } from 'formik';

import { ConnectButton } from '@rainbow-me/rainbowkit';

const CreatePost = () => {
  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      track: "",
    },
    onSubmit: (values) => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <div>
      <div className="fixed top-4 right-4">
        <ConnectButton />
      </div>
      <div className="flex flex-col bg-gray-300">
        <form
          className="flex flex-col p-16 m-auto"
          onSubmit={formik.handleSubmit}
        >
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            onChange={formik.handleChange}
            value={formik.values.name}
          />
          <label htmlFor="description">Description</label>
          <input
            id="description"
            name="description"
            type="text"
            onChange={formik.handleChange}
            value={formik.values.description}
          />

          <label htmlFor="track">Track</label>
          <input
            id="track"
            name="track"
            type="file"
            accept="audio/*"
            onChange={formik.handleChange}
            value={formik.values.track}
          />

          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
