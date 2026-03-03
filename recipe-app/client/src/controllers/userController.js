// 

export class UserController {
  constructor(store) {
    this.store = store;
  }

  register(formData) {
    return this.store.register(formData);
  }

  login(formData) {
    return this.store.login(formData);
  }

  deleteAccount() {
    return this.store.deleteMe();
  }
}
