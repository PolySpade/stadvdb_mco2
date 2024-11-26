import React, { useState , useContext} from "react";
import Games_Table from "../components/tables/Games_Table";
import Insert_Form from "../components/forms/Insert_Form";
import Update_Form from "../components/forms/Update_Form";
import Delete_Form from "../components/forms/Delete_Form";

const Landing = () => {
  const [insertForm, setInsertForm] = useState(false);

  return (
    <div className="flex flex-col justify-center items-center">
          <div className="flex-col space-x-4">
            <button
              onClick={() => setInsertForm(!insertForm)}
              className="btn bg-blue-600 text-white"
            >
              Insert
            </button>


          </div>
          <div className="absolute z-10">
            {insertForm && <Insert_Form onClose={() => setInsertForm(false)} />}
          </div>
        <Games_Table />
    </div>
  );
};

export default Landing;
